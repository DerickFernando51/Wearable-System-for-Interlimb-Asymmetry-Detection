from fastapi import FastAPI, WebSocket
import firebase_admin
from firebase_admin import credentials, db
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
import asyncio

# Firebase init
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://wearable-for-ila-detection-default-rtdb.asia-southeast1.firebasedatabase.app"
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
        return last_timestamp  # nothing new, keep old timestamp

    latest_timestamp = sorted_data[-1]["timestamp"]

    if latest_timestamp != last_timestamp:
        # Extract raw arrays
        accel_x = np.array([item.get("accel", {}).get("x", 0) for item in sorted_data])
        accel_y = np.array([item.get("accel", {}).get("y", 0) for item in sorted_data])
        accel_z = np.array([item.get("accel", {}).get("z", 0) for item in sorted_data])

        # DC bias removal
        accel_x_dcb = accel_x - np.mean(accel_x)
        accel_y_dcb = accel_y - np.mean(accel_y)
        accel_z_dcb = accel_z - np.mean(accel_z)

        # Build payload
        processed_data = [
            {
                "timestamp": sorted_data[i]["timestamp"],
                "raw": {
                    "x": float(accel_x[i]),
                    "y": float(accel_y[i]),
                    "z": float(accel_z[i])
                },
                "dcb_removed": {
                    "x": float(accel_x_dcb[i]),
                    "y": float(accel_y_dcb[i]),
                    "z": float(accel_z_dcb[i])
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
