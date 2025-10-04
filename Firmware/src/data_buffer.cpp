#include "data_buffer.h"

SensorData dataBuffer[BUFFER_SIZE];
int bufferHead = 0;
int bufferTail = 0;
bool bufferFull = false;

void addToBuffer(SensorData data) {
    dataBuffer[bufferHead] = data;
    bufferHead = (bufferHead + 1) % BUFFER_SIZE;
    if (bufferHead == bufferTail) {
        bufferFull = true;
        bufferTail = (bufferTail + 1) % BUFFER_SIZE; // overwrite oldest
    }
}

bool isBufferEmpty() {
    return bufferHead == bufferTail && !bufferFull;
}

SensorData getFromBuffer() {
    SensorData data = dataBuffer[bufferTail];
    bufferTail = (bufferTail + 1) % BUFFER_SIZE;
    bufferFull = false;
    return data;
}
