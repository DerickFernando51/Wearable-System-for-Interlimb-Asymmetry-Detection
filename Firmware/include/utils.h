#pragma once
#include <Arduino.h>
#include <stdint.h>

uint64_t getCurrentNTPMillis();
void formatRelativeTimestamp(char *buffer, uint64_t currentMillis, uint64_t startMillis);
