#include <Arduino.h>
#include "config.h"
#include "imu.h"
#include "fsr.h"
#include "wifi_manager.h"
#include "recording_control_task.h"
#include "sampling_task.h"
#include "uploading_task.h"
#include "Wire.h"
#include "firebase_manager.h"


bool isRecording = false;
uint64_t recordingStartNTP = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);

    Wire.begin(8, 9); // I2C for IMU
    if (!imuBegin()) {
        Serial.println("MPU6050 not found!");
        while (1) delay(10);
    }
    Serial.println("IMU initialized");

    connectWiFi();
    firebaseInit();
    analogReadResolution(12);
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);

    // Start FreeRTOS tasks
    startRecordingControlTask();
    startSamplingTask();
    startUploadingTask();
}

void loop() {
    vTaskDelay(pdMS_TO_TICKS(1000)); // idle
}
