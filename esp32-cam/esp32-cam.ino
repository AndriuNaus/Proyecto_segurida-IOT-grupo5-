#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>

// ==========================================
// CONFIGURACIÓN DE RED WIFI y SERVIDOR
// ==========================================
const char* ssid = "TU_SSID_WIFI";
const char* password = "TU_CONTRASEÑA_WIFI";

// Dirección del servidor (Backend de Node.js)
// Para Localhost (cambia 192.168.1.XX por la IP local de tu PC):
// const char* serverUrl = "http://192.168.1.XX:3000/api/camera/upload";
// Para AWS:
const char* serverUrl = "http://3.133.100.38:3000/api/camera/upload";

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

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

  // 1. Configuración física de la cámara (AI-Thinker Pins)
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Inicialización de la calidad y tamaño de fotogramas según PSRAM
  if(psramFound()){
    config.frame_size = FRAMESIZE_VGA;  // VGA por defecto (640x480)
    config.jpeg_quality = 14;           // 10-63 (menor es mejor calidad)
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  // Inicialización de la cámara
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Error al inicializar la cámara: 0x%x", err);
    return;
  }

  // Ajustes de sensor opcionales para mejorar brillo/contraste
  sensor_t * s = esp_camera_sensor_get();
  s->set_brightness(s, 1);     // -2 a 2
  s->set_contrast(s, 0);       // -2 a 2
  s->set_whitebal(s, 1);       // 0 o 1

  // 2. Conexión WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("¡WiFi conectado exitosamente!");
  Serial.print("IP local de la cámara: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Obtener fotograma actual
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Error al capturar frame");
    delay(1000);
    return;
  }

  // Verificar estado de conexión WiFi antes de subir
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "image/jpeg");
    
    // Realizar POST enviando la imagen binaria cruda
    int httpResponseCode = http.POST(fb->buf, fb->len);
    
    if (httpResponseCode > 0) {
      Serial.printf("Frame enviado con éxito, respuesta: %d\n", httpResponseCode);
    } else {
      Serial.printf("Error en el envío POST: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    
    http.end();
  } else {
    Serial.println("WiFi desconectado, reintentando...");
  }

  // Devolver el buffer para poder capturar el siguiente frame
  esp_camera_fb_return(fb);
  
  // Delay en milisegundos para controlar los FPS del stream (ej. 100ms ~ 10 FPS)
  delay(100);
}
