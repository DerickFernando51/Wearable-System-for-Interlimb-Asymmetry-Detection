#include "test_fsr.h"

// Mock FSR Config
int fsrPins[] = {0, 1, 2, 4};
const int numFSRs = 4;
const int FSR_OFFSET = 1000;
const int FSR_Readings[] = {100, 200, 150, 250};

// Mock analogRead
int analogRead(int pin) {
    for (int i = 0; i < numFSRs; i++) {
        if (fsrPins[i] == pin) return FSR_Readings[i];
    }
    return 0;
}

void test_readFSRs_should_return_correct_sum() {
    int total = 0;
    for (int i = 0; i < numFSRs; i++) {
        total += FSR_Readings[i];
    }
    int expectedTotal = total - FSR_OFFSET;

    TEST_ASSERT_EQUAL(expectedTotal, readFSRs());
}
