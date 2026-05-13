/*
 * ECHO-RESPONSE — Combined Node Firmware
 * All sensors on ONE ESP32 DevKit V1
 * 
 * Node 1 sensors (Survivor Detection):
 *   - HC-SR501 PIR Motion      → GPIO 13
 *   - HC-SR04 Ultrasonic TRIG  → GPIO 12
 *   - HC-SR04 Ultrasonic ECHO  → GPIO 14 (via 1kΩ + 2.2kΩ divider)
 *   - Green LED                → GPIO 2 (220Ω resistor)
 *
 * Node 2 sensors (Hazard Monitor):
 *   - MQ-2 Gas Sensor AO       → GPIO 34
 *   - DHT11 Temp/Humidity DATA → GPIO 4 (10kΩ pull-up to 3.3V)
 *   - IR Flame Sensor DO       → GPIO 5
 *   - Red LED                  → GPIO 15 (220Ω resistor)
 *
 * Shared:
 *   - MPU6050 SDA              → GPIO 21
 *   - MPU6050 SCL              → GPIO 22
 *
 * Libraries needed:
 *   - ArduinoJson (by Benoit Blanchon)
 *   - DHT sensor library (by Adafruit)
 *   - Adafruit Unified Sensor
 *   - MPU6050_light (by rfetick)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <MPU6050_light.h>
#include <DHT.h>

// ============== CONFIG — CHANGE THESE ==============
const char* WIFI_SSID = "OPPOAdri";
const char* WIFI_PASS = "adrinath1483";
const char* SERVER_IP = "10.98.188.87";  // Your PC IP
const int   SERVER_PORT = 3001;
// ===================================================

// --- Pin Definitions ---
// Node 1: Survivor Detection
#define PIR_PIN       13
#define TRIG_PIN      12
#define ECHO_PIN      14
#define GREEN_LED_PIN 2

// Node 2: Hazard Monitor
#define MQ2_PIN       34    // Analog input
#define DHT_PIN       4
#define FLAME_PIN     5     // LOW = flame detected
#define RED_LED_PIN   15

#define DHT_TYPE      DHT11

// --- Objects ---
MPU6050 mpu(Wire);
DHT dht(DHT_PIN, DHT_TYPE);

// --- Server URLs ---
String url_node1;
String url_node2;

void setup() {
    Serial.begin(115200);
    Serial.println("\n=== ECHO-RESPONSE Combined Node ===");

    // --- Pin Modes ---
    // Node 1
    pinMode(PIR_PIN, INPUT);
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    pinMode(GREEN_LED_PIN, OUTPUT);
    // Node 2
    pinMode(MQ2_PIN, INPUT);
    pinMode(FLAME_PIN, INPUT);
    pinMode(RED_LED_PIN, OUTPUT);

    // --- DHT11 ---
    dht.begin();
    Serial.println("[OK] DHT11 initialized");

    // --- MPU6050 (I2C) ---
    Wire.begin(21, 22);
    byte status = mpu.begin();
    if (status != 0) {
        Serial.println("[FAIL] MPU6050 not found! Check wiring.");
    } else {
        Serial.println("[OK] MPU6050 connected. Calibrating (hold still)...");
        mpu.calcOffsets();
        Serial.println("[OK] MPU6050 calibrated");
    }

    // --- WiFi ---
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.print("[..] Connecting to WiFi");
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 40) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[OK] WiFi connected! IP: " + WiFi.localIP().toString());
    } else {
        Serial.println("\n[FAIL] WiFi failed! Check credentials.");
    }

    // Build URLs
    url_node1 = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/node1";
    url_node2 = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/node2";

    Serial.println("[OK] Setup complete. Starting sensor loop...\n");
}

// --- Ultrasonic Distance ---
float getDistance() {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    long duration = pulseIn(ECHO_PIN, HIGH, 30000);
    if (duration == 0) return -1.0;
    return duration * 0.034 / 2.0;
}

// --- Send JSON to server ---
bool sendData(String url, String payload) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WARN] WiFi not connected, skipping send");
        return false;
    }
    
    WiFiClient client;
    HTTPClient http;
    http.begin(client, url); // Fix for ESP32 Core 3.x (requires WiFiClient)
    
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(2000);
    int code = http.POST(payload);
    http.end();
    if (code > 0) {
        return true;
    } else {
        Serial.println("[ERR] Send failed: " + String(code));
        return false;
    }
}

void loop() {
    // --- Update MPU6050 (shared between both nodes) ---
    mpu.update();
    float accelX = mpu.getAccX();
    float accelY = mpu.getAccY();
    float accelZ = mpu.getAccZ();

    // =============================================
    // NODE 1: Survivor Detection
    // =============================================
    bool motion = digitalRead(PIR_PIN) == HIGH;
    float distance = getDistance();

    // Green LED: ON when motion detected
    digitalWrite(GREEN_LED_PIN, motion ? HIGH : LOW);

    // Build Node 1 JSON (ArduinoJson v7 syntax)
    JsonDocument doc1;
    doc1["node"] = "node1";
    doc1["pir"] = motion;
    doc1["distance"] = distance;
    doc1["accelX"] = accelX;
    doc1["accelY"] = accelY;
    doc1["accelZ"] = accelZ;
    doc1["led"] = motion;

    String payload1;
    serializeJson(doc1, payload1);

    Serial.print("N1 | PIR:" + String(motion ? "MOTION" : "idle"));
    Serial.print(" | Dist:" + String(distance, 1) + "cm");
    Serial.println(" | Accel:" + String(accelX, 2) + "/" + String(accelY, 2) + "/" + String(accelZ, 2));

    bool ok1 = sendData(url_node1, payload1);

    // =============================================
    // NODE 2: Hazard Monitor
    // =============================================
    int gasRaw = analogRead(MQ2_PIN);
    float gasPPM = map(gasRaw, 0, 4095, 0, 1000);
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    bool flame = digitalRead(FLAME_PIN) == LOW;  // LOW = flame

    // Handle DHT read failures
    if (isnan(temp)) temp = -1;
    if (isnan(hum)) hum = -1;

    // Red LED: ON only if flame detected (MQ-2 needs warmup time)
    bool alert = flame;
    digitalWrite(RED_LED_PIN, alert ? HIGH : LOW);

    // Build Node 2 JSON (ArduinoJson v7 syntax)
    JsonDocument doc2;
    doc2["node"] = "node2";
    doc2["gas"] = gasPPM;
    doc2["temp"] = temp;
    doc2["humidity"] = hum;
    doc2["flame"] = flame;
    doc2["accelX"] = accelX;
    doc2["accelY"] = accelY;
    doc2["accelZ"] = accelZ;
    doc2["led"] = alert;

    String payload2;
    serializeJson(doc2, payload2);

    Serial.print("N2 | Gas:" + String(gasPPM, 0) + "ppm");
    Serial.print(" | Temp:" + String(temp, 1) + "C");
    Serial.print(" | Hum:" + String(hum, 0) + "%");
    Serial.println(" | Flame:" + String(flame ? "YES!" : "no") + " | LED:" + String(alert ? "ON" : "off"));

    bool ok2 = sendData(url_node2, payload2);

    Serial.println(String(ok1 ? "✓" : "✗") + " N1 sent | " + String(ok2 ? "✓" : "✗") + " N2 sent\n");

    delay(1500);  // Match dashboard update rate
}
