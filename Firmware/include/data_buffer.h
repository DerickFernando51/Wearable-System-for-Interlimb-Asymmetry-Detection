#pragma once
#include <Arduino.h>
#include <stdint.h> 

#define BUFFER_SIZE 2000
#define BATCH_SIZE 15

struct SensorData {
    char timestamp[20];
    int force;
    float accel_x, accel_y, accel_z;
    float gyro_x, gyro_y, gyro_z;
};

extern SensorData dataBuffer[BUFFER_SIZE];
extern int bufferHead;
extern int bufferTail;
extern bool bufferFull;

void addToBuffer(SensorData data);
bool isBufferEmpty();
SensorData getFromBuffer();
