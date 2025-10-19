#include "sampling_task.h"
#include "imu.h"
#include "fsr.h"
#include "data_buffer.h"
#include "utils.h"
#include "config.h"

extern bool isRecording;
extern uint64_t recordingStartNTP;

void SamplingTask(void *pvParameters) {
    unsigned long prevMillis = 0;

    for (;;) {
        unsigned long currentMillis = millis();
        if (isRecording && currentMillis - prevMillis >= INTERVAL) {
            prevMillis = currentMillis;

            SensorData data;
            readIMU(data);
            data.force = readFSRs();
            formatRelativeTimestamp(data.timestamp, getCurrentNTPMillis(), recordingStartNTP);

            addToBuffer(data);
        }
        vTaskDelay(pdMS_TO_TICKS(1)); // small yield
    }
}

void startSamplingTask() {
    xTaskCreate(SamplingTask, "SamplingTask", 4096, NULL, 3, NULL);
}
