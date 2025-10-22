#include <Arduino.h>
#include "unity.h"

#include "test_imu.h"
#include "test_fsr.h"

void setup() {
    Serial.begin(115200);
    delay(1000);

    UNITY_BEGIN();
    RUN_TEST(test_imu_initialization_should_return_true);
    RUN_TEST(test_readFSRs_should_return_correct_sum);
    UNITY_END();
}

void loop() {}
