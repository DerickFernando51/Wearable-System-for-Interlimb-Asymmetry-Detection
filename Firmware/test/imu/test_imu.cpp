#include "test_imu.h"

void test_imu_initialization_should_return_true() {
    Serial.println("Running IMU test...");
    if (imuBegin()) {
        Serial.println("IMU test PASSED");
    } else {
        Serial.println("IMU test FAILED");
    }
    TEST_ASSERT_TRUE(imuBegin());
}
