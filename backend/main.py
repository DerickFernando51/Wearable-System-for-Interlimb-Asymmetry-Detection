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

# WebSocket endpoint
@app.websocket("/ws/imu")
async def imu_ws(websocket: WebSocket):
    await websocket.accept()
    last_timestamp = None

    while True:
        left_data = db.reference("leftFoot").get() or {}
        left_sorted = sorted(left_data.values(), key=lambda x: x["timestamp"])

        if not left_sorted:
            await asyncio.sleep(0.2)
            continue

        latest_timestamp = left_sorted[-1]["timestamp"]

        if latest_timestamp != last_timestamp:
            # Extract raw arrays
            accel_x = np.array([item.get("accel", {}).get("x", 0) for item in left_sorted])
            accel_y = np.array([item.get("accel", {}).get("y", 0) for item in left_sorted])
            accel_z = np.array([item.get("accel", {}).get("z", 0) for item in left_sorted])

            # DC bias removal
            accel_x_dcb = accel_x - np.mean(accel_x)
            accel_y_dcb = accel_y - np.mean(accel_y)
            accel_z_dcb = accel_z - np.mean(accel_z)

            # Build payload
            processed_data = [
                {
                    "timestamp": left_sorted[i]["timestamp"],
                    "raw": {"x": float(accel_x[i]), "y": float(accel_y[i]), "z": float(accel_z[i])},
                    "dcb_removed": {"x": float(accel_x_dcb[i]), "y": float(accel_y_dcb[i]), "z": float(accel_z_dcb[i])}
                }
                for i in range(len(left_sorted))
            ]

            await websocket.send_json({"leftFoot": processed_data})
            last_timestamp = latest_timestamp

        await asyncio.sleep(0.2)  # small delay to prevent busy-wait
