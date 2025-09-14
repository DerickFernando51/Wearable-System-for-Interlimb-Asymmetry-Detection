from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import firebase_admin
from firebase_admin import credentials, db
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
from scipy.signal import medfilt
import os
from dotenv import load_dotenv
import asyncio

KERNEL_SIZE = 5
KERNEL_SIZE_FORCE = 3
left_foot_buffer = []
right_foot_buffer = []


# Firebase init
load_dotenv()
db_url = os.getenv("FIREBASE_DB_URL")
cred = credentials.Certificate("backend/serviceAccountKey.json")
firebase_admin.initialize_app(cred, {"databaseURL": db_url})

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def send_new_data(foot_name, last_timestamp, websocket):
    global left_foot_buffer, right_foot_buffer

    # Build query: only fetch items with timestamp >= last_timestamp
    ref = db.reference(foot_name)

    if last_timestamp is None:
     data = ref.get() or {} # Fetch everything for this session
    else:
        # Only fetch new points greater than last_timestamp
        data = (
            ref.order_by_child("timestamp")
            .start_at(float(last_timestamp) + 0.0001)  # avoid duplicate boundary
            .get()
            or {}
        )

    # Flatten batches
    all_batches = []
    for _, value in (data.items() if isinstance(data, dict) else []):
        batch_list = value.get("batch", [])
        for item in batch_list:
            all_batches.append(item)

    if not all_batches:
        return last_timestamp

    # Sort chronologically
    all_batches.sort(key=lambda x: float(x["timestamp"]))

    latest_timestamp = all_batches[-1]["timestamp"]

    # Extract sensor data 
    accel_x = np.array([item.get("accel", {}).get("x", 0) for item in all_batches])
    accel_y = np.array([item.get("accel", {}).get("y", 0) for item in all_batches])
    accel_z = np.array([item.get("accel", {}).get("z", 0) for item in all_batches])
    gyro_x = np.array([item.get("gyro", {}).get("x", 0) for item in all_batches])
    gyro_y = np.array([item.get("gyro", {}).get("y", 0) for item in all_batches])
    gyro_z = np.array([item.get("gyro", {}).get("z", 0) for item in all_batches])
    force = np.array([item.get("force", 0) for item in all_batches])

    # DC bias removal
    accel_x_dcb = accel_x - np.mean(accel_x)
    accel_y_dcb = accel_y - np.mean(accel_y)
    accel_z_dcb = accel_z - np.mean(accel_z)
    gyro_x_dcb = gyro_x - np.mean(gyro_x)
    gyro_y_dcb = gyro_y - np.mean(gyro_y)
    gyro_z_dcb = gyro_z - np.mean(gyro_z)
    force_dcb = force - np.mean(force)

    # Median filtering
    accel_x_filt = medfilt(accel_x_dcb, KERNEL_SIZE)
    accel_y_filt = medfilt(accel_y_dcb, KERNEL_SIZE)
    accel_z_filt = medfilt(accel_z_dcb, KERNEL_SIZE)
    gyro_x_filt = medfilt(gyro_x_dcb, KERNEL_SIZE)
    gyro_y_filt = medfilt(gyro_y_dcb, KERNEL_SIZE)
    gyro_z_filt = medfilt(gyro_z_dcb, KERNEL_SIZE)
    force_filt = medfilt(force_dcb, KERNEL_SIZE_FORCE)

    processed_data = []

    for i, item in enumerate(all_batches):
        # Prepare full processed structure for frontend
        pd = {
            "timestamp": round(float(item["timestamp"]), 3),
            "force": {
                "raw": round(float(force[i]), 3),
                "dcb_removed": round(float(force_dcb[i]), 3),
                "median_filtered": round(float(force_filt[i]), 3)
            },
            "accel": {
                "raw":  {"x": round(float(accel_x[i]), 3), "y": round(float(accel_y[i]), 3), "z": round(float(accel_z[i]), 3)},
                "dcb_removed":  {"x": round(float(accel_x_dcb[i]), 3), "y": round(float(accel_y_dcb[i]), 3), "z": round(float(accel_z_dcb[i]), 3)},
                "median_filtered":   {"x": round(float(accel_x_filt[i]), 3), "y": round(float(accel_y_filt[i]), 3), "z": round(float(accel_z_filt[i]), 3)},
            },
            "gyro": {
                "raw": {"x": round(float(gyro_x[i]), 3), "y": round(float(gyro_y[i]), 3), "z": round(float(gyro_z[i]), 3)},
                "dcb_removed": {"x": round(float(gyro_x_dcb[i]), 3), "y": round(float(gyro_y_dcb[i]), 3), "z": round(float(gyro_z_dcb[i]), 3)},
                "median_filtered": {"x": round(float(gyro_x_filt[i]), 3), "y": round(float(gyro_y_filt[i]), 3), "z": round(float(gyro_z_filt[i]), 3)},
            
            
                }
            }
        
        processed_data.append(pd)

     
        
        rms_accel = np.sqrt(accel_x_filt[i]**2 + accel_y_filt[i]**2 + accel_z_filt[i]**2)
        rms_gyro = np.sqrt(gyro_x_filt[i]**2 + gyro_y_filt[i]**2 + gyro_z_filt[i]**2)

        buf_item = {
            "force": round(float(force[i]), 3),
            "accel": round(rms_accel, 3),
            "gyro": round(rms_gyro, 3),
        }

        if foot_name == "leftFoot":
            left_foot_buffer.append(buf_item)
        else:
            right_foot_buffer.append(buf_item)

    print(f"[DEBUG] {foot_name} processed_data sample:", processed_data[:5])

    await websocket.send_json({foot_name: {"batch": processed_data}})
    return latest_timestamp

async def calculate_asymmetry_index(websocket):

    global left_foot_buffer, right_foot_buffer

    if not left_foot_buffer or not right_foot_buffer:
        return

    channels = ["force", "accel", "gyro"]
    asymmetry_index = {}

    for ch in channels:
        left_values = np.array([item[ch] for item in left_foot_buffer])
        right_values = np.array([item[ch] for item in right_foot_buffer])
        left_mean = np.mean(np.abs(left_values))
        right_mean = np.mean(np.abs(right_values))

        if left_mean == 0 or right_mean == 0:
             asymmetry_index[ch] = 0
        else:
            strong = max(np.mean(np.abs(left_values)), np.mean(np.abs(right_values)))
            weak = min(np.mean(np.abs(left_values)), np.mean(np.abs(right_values)))
            total = np.mean(np.abs(left_values)) + np.mean(np.abs(right_values))
            asymmetry_index[ch] = ((strong - weak) / total * 100) if total != 0 else 0

    await websocket.send_json({"asymmetry_index": asymmetry_index})

    # Clear buffers
    left_foot_buffer.clear()
    right_foot_buffer.clear()

@app.websocket("/ws/imu")
async def imu_ws(websocket: WebSocket):
    global recording
    await websocket.accept()
    last_left_ts = None
    last_right_ts = None

    try:
        while True:
            # Get current recording state
            recording_state = db.reference("commands/recording").get() or False

            # Calculate asymmetry only when recording stops
            if not recording_state:
                await calculate_asymmetry_index(websocket)
                await asyncio.sleep(0.5)

            # Stream new data to frontend
            last_left_ts = await send_new_data("leftFoot", last_left_ts, websocket)
            last_right_ts = await send_new_data("rightFoot", last_right_ts, websocket)

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        print("Client disconnected")