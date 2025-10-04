#pragma once

#include <WiFi.h>
#include <FirebaseESP32.h>
#include "credentials.h"

#ifndef CONFIG_H
#define CONFIG_H

// Wi-Fi
#define WIFI_SSID       ENV_WiFiSSID
#define WIFI_PASSWORD   ENV_WiFiPassword

// Firebase
#define FIREBASE_HOST       ENV_FirebaseHost
#define FIREBASE_API_KEY    ENV_FirebaseApiKey
#define FIREBASE_USER_EMAIL ENV_FirebaseUserEmail
#define FIREBASE_USER_PASSWORD ENV_FirebaseUserPassword




// --- NTP TIME ---
#define NTP_SERVER "pool.ntp.org"
#define GMT_OFFSET_SEC 36000      // GMT+10
#define DAYLIGHT_OFFSET_SEC 0

// --- SAMPLING ---
#define SAMPLE_FREQ 100
const unsigned long INTERVAL = 1000 / SAMPLE_FREQ;
#define BUFFER_SIZE 2000
#define BATCH_SIZE 15

// --- FSR PINS ---
const int fsrPins[] = {0,1,2,4};
const int numFSRs = sizeof(fsrPins)/sizeof(fsrPins[0]);

// --- WEARABLE SELECTION ---
#define WEARABLE_LEFT   // comment this and uncomment the next line for right foot
// #define WEARABLE_RIGHT

#ifdef WEARABLE_LEFT
extern const char* FIREBASE_PATH;
extern const int FSR_OFFSET;
#endif

#ifdef WEARABLE_RIGHT
extern const char* FIREBASE_PATH;
extern const int FSR_OFFSET;
#endif

#endif


