#include "fsr.h"
#include "config.h"

int readFSRs() {
    int totalForce = 0;
    for (int i=0; i<numFSRs; i++)
        totalForce += analogRead(fsrPins[i]);
    totalForce -= FSR_OFFSET;   // use left/right offset from config
    return totalForce;
}
