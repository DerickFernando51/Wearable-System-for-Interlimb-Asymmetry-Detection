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
cred = credentials.Certificate("backend/serviceAccountKey2.json")
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
    ref = db.reference(foot_name)
    data = ref.order_by_child("timestamp").start_at(last_timestamp or 0).get() or {}
    sorted_data = sorted(data.values(), key=lambda x: x["timestamp"])
    
    # Only new points
    new_data = [item for item in sorted_data if last_timestamp is None or item["timestamp"] > last_timestamp]
    if not new_data:
        return last_timestamp
    
    latest_timestamp = new_data[-1]["timestamp"]

    # Process new data
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

    # Prepare payload
    processed_data = [
        {
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
        for i, item in enumerate(new_data)
    ]

    await websocket.send_json({foot_name: processed_data})
    return latest_timestamp

@app.websocket("/ws/imu")
async def imu_ws(websocket: WebSocket):
    await websocket.accept()
    last_left_ts = None
    last_right_ts = None
    try:
        while True:
            last_left_ts = await send_new_data("leftFoot", last_left_ts, websocket)
            last_right_ts = await send_new_data("rightFoot", last_right_ts, websocket)
            await asyncio.sleep(0.2)  
    except WebSocketDisconnect:
        print("Client disconnected")
