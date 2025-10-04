#pragma once
#include "data_buffer.h"
#include <stdint.h> 

bool imuBegin();
void readIMU(SensorData &data);
