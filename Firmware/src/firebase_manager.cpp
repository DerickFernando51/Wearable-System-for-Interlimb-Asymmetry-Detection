#include "firebase_manager.h"
#include "config.h"
#include <Arduino.h>

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void firebaseInit() {
    config.host = FIREBASE_HOST;
    config.api_key = FIREBASE_API_KEY;
    auth.user.email = FIREBASE_USER_EMAIL;
    auth.user.password = FIREBASE_USER_PASSWORD;

    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);
}

bool getRecordingState(bool &isRecording) {
    if (WiFi.status() != WL_CONNECTED) return false;
    if (Firebase.getBool(fbdo, "/commands/recording")) {
        bool state = fbdo.boolData();
        if (state != isRecording) {
            isRecording = state;
            return true;
        }
    }
    return false;
}

void pushSensorDataBatch() {
    if (isBufferEmpty()) return;

    int available = bufferFull ? BUFFER_SIZE : (bufferHead - bufferTail + BUFFER_SIZE) % BUFFER_SIZE;
    if (available < 5) return;

    FirebaseJsonArray jsonArray;
    int count = 0;
    while (!isBufferEmpty() && count < BATCH_SIZE) {
        SensorData data = getFromBuffer();
        FirebaseJson json;
        json.set("timestamp", String(data.timestamp));
        json.set("force", data.force);
        json.set("accel/x", data.accel_x);
        json.set("accel/y", data.accel_y);
        json.set("accel/z", data.accel_z);
        json.set("gyro/x", data.gyro_x);
        json.set("gyro/y", data.gyro_y);
        json.set("gyro/z", data.gyro_z);
        jsonArray.add(json);
        count++;
    }

    FirebaseJson wrapper;
    wrapper.set("batch", jsonArray);
    Firebase.pushJSON(fbdo, FIREBASE_PATH, wrapper);
}
