from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import firebase_admin
from firebase_admin import credentials, db
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
from scipy.signal import medfilt
import os
import json
from dotenv import load_dotenv
import asyncio

KERNEL_SIZE = 5
KERNEL_SIZE_FORCE = 3
left_foot_buffer = []
right_foot_buffer = []


# Firebase init
load_dotenv()
db_url = os.getenv("FIREBASE_DB_URL")
#cred = credentials.Certificate("backend/serviceAccountKey.json")


service_account_info = os.getenv("FIREBASE_SERVICE_ACCOUNT")
cred = credentials.Certificate(json.loads(service_account_info))
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



async def send_new_data(foot_name, websocket):
    global left_foot_buffer, right_foot_buffer

    # Fetch all data from Firebase
    ref = db.reference(foot_name)
    data = ref.get() or {}  # fetch everything

    # Flatten batches
    all_batches = []
    for _, value in (data.items() if isinstance(data, dict) else []):
        batch_list = value.get("batch", [])
        for item in batch_list:
            all_batches.append(item)

    if not all_batches:
        return

    # Sort chronologically
    all_batches.sort(key=lambda x: float(x["timestamp"]))

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
            "force": round(float(force_filt[i]), 3),
            "accel": round(rms_accel, 3),
            "gyro": round(rms_gyro, 3),
        }

        if foot_name == "leftFoot":
            left_foot_buffer.append(buf_item)
        else:
            right_foot_buffer.append(buf_item)

    print(f"[DEBUG] {foot_name} processed_data sample:", processed_data[:5])

    await websocket.send_json({foot_name: {"batch": processed_data}})




async def calculate_asymmetry_index(websocket):
    global left_foot_buffer, right_foot_buffer


    if not left_foot_buffer or not right_foot_buffer:
        return

    channels = ["force", "accel", "gyro"]
    asymmetry_index = {}
    stronger_foot = {}
    signed_indices = {}

    # --- Step 1: Calculate per-channel values ---
    for ch in channels:
        left_values = np.array([item[ch] for item in left_foot_buffer])
        right_values = np.array([item[ch] for item in right_foot_buffer])

        left_median = np.mean(np.abs(left_values))
        right_median = np.mean(np.abs(right_values))

        if left_median == 0 and right_median == 0:
            asymmetry_index[ch] = 0
            signed_indices[ch] = 0
            stronger_foot[ch] = "-"
        else:
            strong = max(left_median, right_median)
            weak = min(left_median, right_median)
            total = left_median + right_median

            asymmetry = ((strong - weak) / total * 100) if total != 0 else 0.0
            asymmetry_index[ch] = round(abs(asymmetry), 3)

            # signed asymmetry and stronger side
            if left_median > right_median:
                signed_indices[ch] = round(asymmetry, 3)   # Left = +
                stronger_foot[ch] = "Left"
            elif right_median > left_median:
                signed_indices[ch] = round(-asymmetry, 3)  # Right = -
                stronger_foot[ch] = "Right"
            else:
                signed_indices[ch] = 0
                stronger_foot[ch] = "Equal"

    # --- Step 2: Compute signed composite score ---
    signed_comp_score = np.mean(list(signed_indices.values()))

    # --- Step 3: Overall stronger foot from signed score ---
    if signed_comp_score > 0:
        overall_stronger = "Left"
    elif signed_comp_score < 0:
        overall_stronger = "Right"
    else:
        overall_stronger = "Equal"

    # --- Step 4: Final comp_score is absolute value ---
    comp_score = round(abs(signed_comp_score), 3)
    total_asym = sum(asymmetry_index[ch] for ch in channels)

    if total_asym > 0:
        accel_contribution = round((asymmetry_index["accel"] / total_asym) * 100, 3)
        gyro_contribution = round((asymmetry_index["gyro"] / total_asym) * 100, 3)
        force_contribution = round((asymmetry_index["force"] / total_asym) * 100, 3)
    else:
        accel_contribution = gyro_contribution = force_contribution = 0.0
    
    left_foot_buffer.clear()
    right_foot_buffer.clear()

    # --- Step 5: Send results ---
    await websocket.send_json({
        "comp_score": comp_score,
        "overall_stronger": overall_stronger, 
        "accel_contribution": accel_contribution,
        "gyro_contribution": gyro_contribution,
        "force_contribution": force_contribution,
        "asymmetry_index": asymmetry_index,
        "stronger_foot": stronger_foot

         
    })


@app.websocket("/ws/imu")
async def imu_ws(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            # Stream all data to frontend (preprocess all batches each time)
            await send_new_data("leftFoot", websocket)
            await send_new_data("rightFoot", websocket)

             # Get current recording state
            recording_state = db.reference("commands/recording").get() or False

            # Calculate asymmetry only when recording stops
            if not recording_state:
                await calculate_asymmetry_index(websocket)
                await asyncio.sleep(1)

            # Control update rate
            await asyncio.sleep(1.2)

    except WebSocketDisconnect:
        print("Client disconnected")
