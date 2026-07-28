#include "esp_camera.h"
#include <WiFi.h>
#include "esp_http_server.h"
#include "esp_timer.h"
#include "img_converters.h"
#include "Arduino.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ==========================================
// CONFIGURACIÓN DE RED WIFI
// ==========================================
const char* ssid     = "TU_SSID_WIFI";
const char* password = "TU_CONTRASEÑA_WIFI";

// ==========================================
// CONFIGURACIÓN DE IP ESTÁTICA (Opcional)
// ==========================================
#define USE_STATIC_IP 0
IPAddress staticIP(192, 168, 1, 50);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress primaryDNS(8, 8, 8, 8);

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
// VARIABLES DE SERVIDOR HTTP
// ==========================================
httpd_handle_t stream_httpd = NULL;

#define PART_BOUNDARY "123456789000000000000987654321"
static const char* STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

// ==========================================
// HANDLER: GET /stream
// ==========================================
static esp_err_t stream_handler(httpd_req_t *req) {
    esp_err_t res = ESP_OK;
    size_t _jpg_buf_len = 0;
    uint8_t * _jpg_buf = NULL;
    char * part_buf[64];
    
    res = httpd_resp_set_type(req, STREAM_CONTENT_TYPE);
    if (res != ESP_OK) return res;

    while (true) {
        camera_fb_t * fb = esp_camera_fb_get();
        if (!fb) {
            Serial.println("Error al capturar frame");
            res = ESP_FAIL;
            break;
        }

        if (fb->format != PIXFORMAT_JPEG) {
            bool jpeg_converted = frame2jpg(fb, 80, &_jpg_buf, &_jpg_buf_len);
            esp_camera_fb_return(fb);
            fb = NULL;
            if (!jpeg_converted) {
                Serial.println("Compresión a JPEG falló");
                res = ESP_FAIL;
                break;
            }
        } else {
            _jpg_buf_len = fb->len;
            _jpg_buf = fb->buf;
        }

        size_t hlen = snprintf((char *)part_buf, 64, STREAM_PART, _jpg_buf_len);
        res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
        if (res == ESP_OK) {
            res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
        }
        if (res == ESP_OK) {
            res = httpd_resp_send_chunk(req, STREAM_BOUNDARY, strlen(STREAM_BOUNDARY));
        }

        if (fb) {
            esp_camera_fb_return(fb);
            fb = NULL;
            _jpg_buf = NULL;
        } else if (_jpg_buf) {
            free(_jpg_buf);
            _jpg_buf = NULL;
        }

        if (res != ESP_OK) break;
    }
    return res;
}

void startCameraServer() {
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.server_port = 80;

    httpd_uri_t stream_uri = {
        .uri       = "/stream",
        .method    = HTTP_GET,
        .handler   = stream_handler,
        .user_ctx  = NULL
    };

    if (httpd_start(&stream_httpd, &config) == ESP_OK) {
        httpd_register_uri_handler(stream_httpd, &stream_uri);
        Serial.println("Servidor de cámara iniciado en puerto 80");
    } else {
        Serial.println("Error al iniciar el servidor de cámara");
    }
}

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
    config.grab_mode    = CAMERA_GRAB_WHEN_EMPTY; // CRÍTICO: Evita cuelgues

    if (psramFound()) {
        config.frame_size   = FRAMESIZE_VGA;      // 640x480
        config.jpeg_quality = 12;
        config.fb_count     = 1;
        config.fb_location  = CAMERA_FB_IN_DRAM;  // CRÍTICO: Usar DRAM
        Serial.println("PSRAM encontrada, pero forzando DRAM.");
    } else {
        config.frame_size   = FRAMESIZE_QVGA;     // 320x240
        config.jpeg_quality = 15;
        config.fb_count     = 1;
        config.fb_location  = CAMERA_FB_IN_DRAM;
        Serial.println("Sin PSRAM. Usando DRAM.");
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
// FUNCIÓN: conectar WiFi
// ==========================================
void connectWiFi() {
    Serial.print("Conectando a WiFi");
    
    WiFi.setSleep(false); // CRÍTICO: Previene desconexiones WiFi
    WiFi.mode(WIFI_STA);

    if (USE_STATIC_IP) {
        WiFi.config(staticIP, gateway, subnet, primaryDNS);
    }

    WiFi.disconnect(true);
    delay(100);
    WiFi.begin(ssid, password);

    int retries = 0;
    // Backoff reconnect (40 intentos x 500ms)
    while (WiFi.status() != WL_CONNECTED && retries < 40) {
        delay(500);
        Serial.print(".");
        retries++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\nWiFi conectado! IP: %s\n", WiFi.localIP().toString().c_str());
    } else {
        Serial.println("\nFallo la conexion WiFi. Se reintentara desde el loop.");
    }
}

// ==========================================
// SETUP
// ==========================================
void setup() {
    // NO DESACTIVAR el brownout detector (recomendación del plan)
    // WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

    Serial.begin(115200);
    Serial.setDebugOutput(false);
    
    Serial.println("\n=== ESP32-CAM iniciando en MODO PULL (Stream) ===");
    
    if (!initCamera()) {
        Serial.println("Fallo critico en la camara. Reiniciando en 5s...");
        delay(5000);
        ESP.restart();
    }

    connectWiFi();

    if (WiFi.status() == WL_CONNECTED) {
        startCameraServer();
    }
}

// ==========================================
// LOOP
// ==========================================
void loop() {
    // Reconectar WiFi si se cae
    if (WiFi.status() != WL_CONNECTED) {
        connectWiFi();
    }
    
    // Todo ocurre en el servidor HTTP corriendo en background
    delay(1000);
}
