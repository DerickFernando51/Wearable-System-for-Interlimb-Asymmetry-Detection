#include "uploading_task.h"
#include "firebase_manager.h"

void UploadingTask(void *pvParameters) {
    for (;;) {
        pushSensorDataBatch();
        vTaskDelay(pdMS_TO_TICKS(250)); // upload every 250 ms
    }
}

void startUploadingTask() {
    xTaskCreate(UploadingTask, "UploadingTask", 8192, NULL, 1, NULL);
}
