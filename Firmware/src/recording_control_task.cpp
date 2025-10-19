#include "recording_control_task.h"
#include "firebase_manager.h"
#include "utils.h"

extern bool isRecording;
extern uint64_t recordingStartNTP;

void RecordingControlTask(void *pvParameters) {
    for (;;) {
        if (getRecordingState(isRecording)) {
            if (isRecording) {
                recordingStartNTP = getCurrentNTPMillis();
                Serial.println("Recording started");
            } else {
                Serial.println("Recording stopped");
            }
        }
        vTaskDelay(pdMS_TO_TICKS(500)); // check every 500 ms
    }
}

void startRecordingControlTask() {
    xTaskCreate(RecordingControlTask, "RecordingControlTask", 8192, NULL, 2, NULL);
}
