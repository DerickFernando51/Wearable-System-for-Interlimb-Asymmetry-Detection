from fastapi import FastAPI, WebSocket
import firebase_admin
from firebase_admin import credentials, db
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from scipy.signal import medfilt
import os
from dotenv import load_dotenv

KERNEL_SIZE=5


# Firebase init
load_dotenv()
db_url = os.getenv("FIREBASE_DB_URL")
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": db_url
})

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def process_data(foot_name, last_timestamp, websocket):
    data = db.reference(foot_name).get() or {}
    sorted_data = sorted(data.values(), key=lambda x: x["timestamp"])

    if not sorted_data:
        return last_timestamp   

    latest_timestamp = sorted_data[-1]["timestamp"]

    if latest_timestamp != last_timestamp:
          # Extract acceleration arrays
        accel_x = np.array([item.get("accel", {}).get("x", 0) for item in sorted_data])
        accel_y = np.array([item.get("accel", {}).get("y", 0) for item in sorted_data])
        accel_z = np.array([item.get("accel", {}).get("z", 0) for item in sorted_data])

        # Extract angular velocity arrays
        gyro_x = np.array([item.get("gyro", {}).get("x", 0) for item in sorted_data])
        gyro_y = np.array([item.get("gyro", {}).get("y", 0) for item in sorted_data])
        gyro_z = np.array([item.get("gyro", {}).get("z", 0) for item in sorted_data])

        # DC bias removal
        accel_x_dcb = accel_x - np.mean(accel_x)
        accel_y_dcb = accel_y - np.mean(accel_y)
        accel_z_dcb = accel_z - np.mean(accel_z)

        gyro_x_dcb = gyro_x - np.mean(gyro_x)
        gyro_y_dcb = gyro_y - np.mean(gyro_y)
        gyro_z_dcb = gyro_z - np.mean(gyro_z)

        # Median filtering  
        accel_x_filt = medfilt(accel_x_dcb, kernel_size=KERNEL_SIZE)
        accel_y_filt = medfilt(accel_y_dcb, kernel_size=KERNEL_SIZE)
        accel_z_filt = medfilt(accel_z_dcb, kernel_size=KERNEL_SIZE)

        gyro_x_filt = medfilt(gyro_x_dcb, kernel_size=KERNEL_SIZE)
        gyro_y_filt = medfilt(gyro_y_dcb, kernel_size=KERNEL_SIZE)
        gyro_z_filt = medfilt(gyro_z_dcb, kernel_size=KERNEL_SIZE)

        # Build payload
        processed_data = [
            {
                "timestamp": sorted_data[i]["timestamp"],
                "accel": {
                    "raw": {"x": float(accel_x[i]), "y": float(accel_y[i]), "z": float(accel_z[i])},
                    "dcb_removed": {"x": float(accel_x_dcb[i]), "y": float(accel_y_dcb[i]), "z": float(accel_z_dcb[i])},
                    "median_filtered": {"x": float(accel_x_filt[i]), "y": float(accel_y_filt[i]), "z": float(accel_z_filt[i])}
                },
                "gyro": {
                    "raw": {"x": float(gyro_x[i]), "y": float(gyro_y[i]), "z": float(gyro_z[i])},
                    "dcb_removed": {"x": float(gyro_x_dcb[i]), "y": float(gyro_y_dcb[i]), "z": float(gyro_z_dcb[i])},
                    "median_filtered": {"x": float(gyro_x_filt[i]), "y": float(gyro_y_filt[i]), "z": float(gyro_z_filt[i])}
                }
            }
            for i in range(len(sorted_data))
        ]

        await websocket.send_json({foot_name: processed_data})
        return latest_timestamp

    return last_timestamp

# WebSocket endpoint
@app.websocket("/ws/imu")
async def imu_ws(websocket: WebSocket):
    await websocket.accept()
    last_left_timestamp = None
    last_right_timestamp = None

    while True:
        last_left_timestamp = await process_data("leftFoot", last_left_timestamp, websocket)
        last_right_timestamp = await process_data("rightFoot", last_right_timestamp, websocket)
        await asyncio.sleep(0.2)
