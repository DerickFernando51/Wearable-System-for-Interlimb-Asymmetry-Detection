#include "config.h"

#ifdef WEARABLE_LEFT
const char* FIREBASE_PATH = "/leftFoot";
const int FSR_OFFSET = 4400;
#endif

#ifdef WEARABLE_RIGHT
const char* FIREBASE_PATH = "/rightFoot";
const int FSR_OFFSET = 2390;
#endif
