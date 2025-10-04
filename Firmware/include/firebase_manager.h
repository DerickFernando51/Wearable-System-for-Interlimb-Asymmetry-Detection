#pragma once
#include <FirebaseESP32.h>
#include "data_buffer.h"
#include <stdint.h> 

extern FirebaseData fbdo;

void firebaseInit();
bool getRecordingState(bool &isRecording);
void pushSensorDataBatch();
