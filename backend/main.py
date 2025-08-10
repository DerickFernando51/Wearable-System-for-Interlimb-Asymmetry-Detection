from fastapi import FastAPI
import firebase_admin
from firebase_admin import credentials, db


# Firebase Initialization 
cred = credentials.Certificate("serviceAccountKey.json")   
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://wearable-for-ila-detection-default-rtdb.asia-southeast1.firebasedatabase.app"    
})

# Create FastAPI app
app = FastAPI()


# Route to firebase data
@app.get("/data")
def get_all_imu_data():
    try:
        # Get full datasets
        left_ref = db.reference("leftFoot")
        right_ref = db.reference("rightFoot")

        left_data = left_ref.get() or {}   # if None, return empty dict
        right_data = right_ref.get() or {}

        return {
            "leftFoot": left_data,
            "rightFoot": right_data
        }

    except Exception as e:
        return {"error": str(e)}
