#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiClient.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ==========================================
// CONFIGURACIÓN DE RED WIFI y SERVIDOR
// ==========================================
const char* ssid     = "TU_SSID_WIFI";
const char* password = "TU_CONTRASEÑA_WIFI";

// Servidor Node.js
const char* serverHost = "3.133.100.38";
const int   serverPort = 3000;
const char* serverPath = "/api/camera/upload";

// Intervalo entre capturas (ms)
#define CAPTURE_INTERVAL_MS 500

// ==========================================
// DEFINICIÓN DE PINES (Modelo AI-Thinker)
// ==========================================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ==========================================
// FUNCIÓN: inicializar cámara
// ==========================================
bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    // Con PSRAM: VGA (640x480), 1 solo buffer para ahorrar memoria
    config.frame_size   = FRAMESIZE_VGA;
    config.jpeg_quality = 12;
    config.fb_count     = 1;
    config.fb_location  = CAMERA_FB_IN_PSRAM;
    Serial.println("PSRAM encontrada. Usando FRAMESIZE_VGA.");
  } else {
    // Sin PSRAM: QVGA (320x240) para no agotar la RAM interna
    config.frame_size   = FRAMESIZE_QVGA;
    config.jpeg_quality = 15;
    config.fb_count     = 1;
    config.fb_location  = CAMERA_FB_IN_DRAM;
    Serial.println("Sin PSRAM. Usando FRAMESIZE_QVGA.");
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Error al inicializar la camara: 0x%x\n", err);
    return false;
  }

  // Ajustes del sensor
  sensor_t* s = esp_camera_sensor_get();
  s->set_brightness(s, 1);
  s->set_contrast(s, 0);
  s->set_whitebal(s, 1);

  Serial.println("Camara inicializada correctamente.");
  return true;
}

// ==========================================
// FUNCIÓN: conectar / reconectar WiFi
// ==========================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Conectando a WiFi");
  WiFi.disconnect(true);
  delay(100);
  WiFi.begin(ssid, password);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi conectado! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nFallo la conexion WiFi. Reintentando en el proximo ciclo.");
  }
}

// ==========================================
// FUNCIÓN: capturar y enviar frame via streaming
// Usa WiFiClient + chunks de 1024 bytes
// → NUNCA copia la imagen completa a otra zona de RAM
// ==========================================
void captureAndSend() {
  // 1. Capturar frame
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Error al capturar frame.");
    return;
  }

  Serial.printf("Frame: %u bytes | Heap: %u | PSRAM: %u\n",
                fb->len, ESP.getFreeHeap(), ESP.getFreePsram());

  // 2. Conectar al servidor
  WiFiClient client;
  client.setTimeout(10);  // 10 segundos de timeout

  if (!client.connect(serverHost, serverPort)) {
    Serial.println("Error: no se pudo conectar al servidor.");
    esp_camera_fb_return(fb);
    return;
  }

  // 3. Enviar cabeceras HTTP manualmente
  client.printf("POST %s HTTP/1.1\r\n", serverPath);
  client.printf("Host: %s:%d\r\n", serverHost, serverPort);
  client.println("Content-Type: image/jpeg");
  client.printf("Content-Length: %u\r\n", fb->len);
  client.println("Connection: close");
  client.println();  // Línea en blanco = fin de headers

  // 4. Enviar imagen en chunks de 1024 bytes (sin copiar todo a RAM)
  uint8_t* buf       = fb->buf;
  size_t   remaining = fb->len;
  const size_t CHUNK = 1024;

  while (remaining > 0) {
    size_t toSend = (remaining > CHUNK) ? CHUNK : remaining;
    size_t written = client.write(buf, toSend);
    if (written == 0) {
      Serial.println("Error enviando chunk. Conexion cortada.");
      break;
    }
    buf       += written;
    remaining -= written;
  }

  // 5. Leer respuesta del servidor
  long timeout = millis();
  while (client.connected() && !client.available()) {
    if (millis() - timeout > 5000) {
      Serial.println("Timeout esperando respuesta.");
      break;
    }
    delay(10);
  }

  if (client.available()) {
    String response = client.readStringUntil('\n');
    Serial.printf("Respuesta: %s\n", response.c_str());
  }

  // 6. Liberar recursos SIEMPRE
  client.stop();
  esp_camera_fb_return(fb);
}

// ==========================================
// SETUP
// ==========================================
void setup() {
  // Deshabilitar brownout detector para evitar resets
  // cuando cámara + WiFi consumen picos de corriente
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println("\n=== ESP32-CAM iniciando ===");
  Serial.printf("Heap libre al inicio: %u bytes\n", ESP.getFreeHeap());

  if (!initCamera()) {
    Serial.println("Fallo critico en la camara. Reiniciando en 5s...");
    delay(5000);
    ESP.restart();
  }

  connectWiFi();

  Serial.printf("Heap libre tras init: %u bytes\n", ESP.getFreeHeap());
  Serial.println("Iniciando captura...");
}

// ==========================================
// LOOP
// ==========================================
void loop() {
  // Reconectar WiFi si se cae
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado. Reconectando...");
    connectWiFi();
    delay(1000);
    return;
  }

  captureAndSend();

  delay(CAPTURE_INTERVAL_MS);
}
