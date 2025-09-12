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

    ref = db.reference(foot_name)
    data = ref.get() or {}  # Get all entries under leftFoot/rightFoot

    # Flatten all batch arrays
    all_batches = []
    for key, value in data.items():
        batch_list = value.get("batch", [])
        for item in batch_list:
            all_batches.append(item)

    # Sort by timestamp
    all_batches.sort(key=lambda x: float(x["timestamp"]))

    # Filter new data
    new_data = [item for item in sorted_data if last_timestamp is None or item["timestamp"] > last_timestamp]
    if not new_data:
        return last_timestamp

    latest_timestamp = new_data[-1]["timestamp"]

    # Extract sensor data and apply DC bias removal + median filtering
    accel_x = np.array([item.get("accel", {}).get("x", 0) for item in new_data])
    accel_y = np.array([item.get("accel", {}).get("y", 0) for item in new_data])
    accel_z = np.array([item.get("accel", {}).get("z", 0) for item in new_data])
    gyro_x = np.array([item.get("gyro", {}).get("x", 0) for item in new_data])
    gyro_y = np.array([item.get("gyro", {}).get("y", 0) for item in new_data])
    gyro_z = np.array([item.get("gyro", {}).get("z", 0) for item in new_data])
    force = np.array([item.get("force", 0) for item in new_data])

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

    for i, item in enumerate(new_data):
        # Prepare full processed structure for frontend
        pd = {
            "timestamp": item["timestamp"],
            "force": {
                "raw": float(force[i]),
                "dcb_removed": float(force_dcb[i]),
                "median_filtered": float(force_filt[i])
            },
            "accel": {
                "raw": {"x": float(accel_x[i]), "y": float(accel_y[i]), "z": float(accel_z[i])},
                "dcb_removed": {"x": float(accel_x_dcb[i]), "y": float(accel_y_dcb[i]), "z": float(accel_z_dcb[i])},
                "median_filtered": {"x": float(accel_x_filt[i]), "y": float(accel_y_filt[i]), "z": float(accel_z_filt[i])},
            },
            "gyro": {
                "raw": {"x": float(gyro_x[i]), "y": float(gyro_y[i]), "z": float(gyro_z[i])},
                "dcb_removed": {"x": float(gyro_x_dcb[i]), "y": float(gyro_y_dcb[i]), "z": float(gyro_z_dcb[i])},
                "median_filtered": {"x": float(gyro_x_filt[i]), "y": float(gyro_y_filt[i]), "z": float(gyro_z_filt[i])},
            }
        }
        processed_data.append(pd)

        # Save median-filtered values for asymmetry calculation
        # buf_item = {
        #     "force": float(force_filt[i]),
        #     "accel_x": float(accel_x_filt[i]),
        #     "accel_y": float(accel_y_filt[i]),
        #     "accel_z": float(accel_z_filt[i]),
        #     "gyro_x": float(gyro_x_filt[i]),
        #     "gyro_y": float(gyro_y_filt[i]),
        #     "gyro_z": float(gyro_z_filt[i]),
        # }

        #rms_accel = np.sqrt(accel_x[i]**2 + accel_y[i]**2 + accel_z[i]**2)
        rms_accel = np.sqrt(accel_x_filt[i]**2 + accel_y_filt[i]**2 + accel_z_filt[i]**2)
        #rms_gyro = np.sqrt(gyro_x[i]**2 + gyro_y[i]**2 + gyro_z[i]**2)
        rms_gyro = np.sqrt(gyro_x_filt[i]**2 + gyro_y_filt[i]**2 + gyro_z_filt[i]**2)

        buf_item = {
            "force": float(force[i]),
            "accel": float(rms_accel),
            "gyro": float(rms_gyro),
        }

        if foot_name == "leftFoot":
            left_foot_buffer.append(buf_item)
        else:
            right_foot_buffer.append(buf_item)

    await websocket.send_json({foot_name: processed_data})
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

            await asyncio.sleep(0.2)

    except WebSocketDisconnect:
        print("Client disconnected")