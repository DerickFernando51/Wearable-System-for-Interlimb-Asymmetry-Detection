#include "utils.h"
#include "time.h"

uint64_t getCurrentNTPMillis() {
    struct tm timeinfo;
    if (getLocalTime(&timeinfo)) {
        uint64_t ntpMillis = (uint64_t)mktime(&timeinfo) * 1000ULL;
        ntpMillis += millis() % 1000;
        return ntpMillis;
    } else {
        return (uint64_t)millis();
    }
}

void formatRelativeTimestamp(char *buffer, uint64_t currentMillis, uint64_t startMillis) {
    if (startMillis == 0 || currentMillis < startMillis) {
        sprintf(buffer, "0.000");
        return;
    }
    double seconds = (currentMillis - startMillis) / 1000.0;
    sprintf(buffer, "%.3f", seconds);
}
