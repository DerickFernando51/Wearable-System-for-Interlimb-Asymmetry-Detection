#include <Arduino.h>
#include "config.h"
#include "imu.h"
#include "fsr.h"
#include "wifi_manager.h"
#include "data_buffer.h"
#include "utils.h"
#include "firebase_manager.h"
#include "Wire.h"

// Global variables
bool isRecording = false;
unsigned long prevMillis = 0;
uint64_t recordingStartNTP = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);

    // Initialize I2C for IMU
    Wire.begin(8, 9); // SDA = GPIO8, SCL = GPIO9

    // Initialize IMU
    if (!imuBegin()) {
        Serial.println("MPU6050 not found!");
        while (1) delay(10);
    }
    Serial.println("IMU initialized");

    // Connect Wi-Fi
    connectWiFi();

    // Initialize Firebase
    firebaseInit();

    // Configure ADC resolution for FSR readings
    analogReadResolution(12);

    // Initialize NTP time
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
}

void loop() {
    unsigned long currentMillis = millis();

    // -------------------
    // Check recording state from Firebase
    // -------------------
    if (currentMillis % 500 < 10) { // every ~500 ms
        if (getRecordingState(isRecording) && isRecording) {
            recordingStartNTP = getCurrentNTPMillis();
            Serial.println("Recording started");
        }  
    }

    // -------------------
    // Sensor sampling
    // -------------------
    if (isRecording && currentMillis - prevMillis >= INTERVAL) {
        prevMillis = currentMillis;

        SensorData data;

        // Read IMU
        readIMU(data);

        // Read FSR
        data.force = readFSRs();

        // Format timestamp
        formatRelativeTimestamp(data.timestamp, getCurrentNTPMillis(), recordingStartNTP);

        // Add to buffer
        addToBuffer(data);
    }

    // -------------------
    // Push data to Firebase
    // -------------------
    static unsigned long lastFirebasePush = 0;
    if (currentMillis - lastFirebasePush >= 250) { // every 250 ms
        pushSensorDataBatch();
        lastFirebasePush = currentMillis;
    }
}
