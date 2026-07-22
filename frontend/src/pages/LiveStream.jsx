import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import { ArrowBack, Videocam, VideocamOff, CameraAlt, SmartToy, Pets } from '@mui/icons-material';
import { uselocalStorage } from '../storage/uselocalStorage';
import { cameraModel } from '../models/cameraModel';
import { FilesetResolver, ObjectDetector } from '@mediapipe/tasks-vision';

function LiveStream() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cameraConnected, setCameraConnected] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');

  // Estados para la IA y la cámara de PC
  const [detectorLoading, setDetectorLoading] = useState(true);
  const [detectorError, setDetectorError] = useState(null);
  const [useWebcam, setUseWebcam] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [detectedObjects, setDetectedObjects] = useState([]);

  // Refs de video, imagen y canvas
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const loopActiveRef = useRef(false);
  const webcamStreamRef = useRef(null);

  // Inicialización de la sesión del usuario
  useEffect(() => {
    const sessionUser = uselocalStorage.get("user");
    if (!sessionUser || !sessionUser.token) {
      navigate('/ingreso');
      return;
    }
    setUser(sessionUser);
    setStreamUrl(cameraModel.getStreamUrl(sessionUser.token));
    fetchCameraStatus(sessionUser.token);
  }, [navigate]);

  const fetchCameraStatus = async (token) => {
    try {
      const result = await cameraModel.getStatus(token);
      if (result.status === 'success') {
        setCameraConnected(result.data.isConnected);
      }
    } catch (err) {
      console.error("Error al obtener estado de cámara:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sondeo periódico para verificar si la cámara sigue conectada
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchCameraStatus(user.token);
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Inicialización de Google MediaPipe Object Detector (GML)
  useEffect(() => {
    let active = true;
    async function loadModel() {
      try {
        setDetectorLoading(true);
        setDetectorError(null);
        // Cargar los archivos WebAssembly (WASM) necesarios
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        // Instanciar el detector con el modelo EfficientDet-Lite0
        const detector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
            delegate: "GPU"
          },
          scoreThreshold: 0.45, // Mostrar detecciones con más del 45% de confianza
          runningMode: "IMAGE"
        });

        if (active) {
          detectorRef.current = detector;
          setDetectorLoading(false);
          console.log("¡Modelo de detección de objetos de MediaPipe cargado correctamente!");
        }
      } catch (err) {
        console.error("Error al cargar el detector de MediaPipe:", err);
        if (active) {
          setDetectorError("No se pudo cargar el modelo de IA. Verifica tu conexión a internet.");
          setDetectorLoading(false);
        }
      }
    }

    loadModel();

    return () => {
      active = false;
      if (detectorRef.current) {
        detectorRef.current.close();
      }
    };
  }, []);

  // Manejo de la cámara web de la PC (activación/desactivación de stream de video local)
  useEffect(() => {
    if (useWebcam) {
      navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 } } 
      })
      .then((stream) => {
        webcamStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Error al acceder a la cámara web:", err);
        alert("No se pudo iniciar la cámara web de tu PC. Asegúrate de otorgar permisos en tu navegador.");
        setUseWebcam(false);
      });
    } else {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(track => track.stop());
        webcamStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [useWebcam]);

  // Bucle de detección en tiempo real
  useEffect(() => {
    loopActiveRef.current = true;

    const detectFrame = () => {
      if (!loopActiveRef.current) return;

      const detector = detectorRef.current;
      const element = useWebcam ? videoRef.current : imageRef.current;

      if (aiEnabled && detector && element) {
        // Verificar si la cámara web o la imagen están listas para ser procesadas
        const isReady = useWebcam 
          ? (element.readyState >= 2) 
          : (element.complete && element.naturalWidth > 0 && cameraConnected);

        if (isReady) {
          try {
            const results = detector.detect(element);
            
            // Filtrar y guardar objetos en el estado
            if (results && results.detections) {
              setDetectedObjects(results.detections);
              drawBoundingBoxes(results.detections, element);
            } else {
              setDetectedObjects([]);
              clearCanvas();
            }
          } catch (err) {
            console.error("Error en detección de frame:", err);
          }
        } else {
          clearCanvas();
          setDetectedObjects([]);
        }
      } else {
        clearCanvas();
        setDetectedObjects([]);
      }

      requestAnimationFrame(detectFrame);
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const drawBoundingBoxes = (detections, element) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = element.clientWidth;
      const height = element.clientHeight;

      // Asegurar que el canvas tenga el mismo tamaño de renderizado que la imagen/video
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Dimensiones de resolución originales del stream
      const srcWidth = useWebcam ? element.videoWidth : element.naturalWidth;
      const srcHeight = useWebcam ? element.videoHeight : element.naturalHeight;

      if (!srcWidth || !srcHeight) return;

      // Cálculo del tamaño real visual del contenido en "object-fit: contain"
      const srcRatio = srcWidth / srcHeight;
      const containerRatio = width / height;

      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (srcRatio > containerRatio) {
        // Limitado por ancho (barras negras arriba y abajo)
        drawHeight = width / srcRatio;
        offsetY = (height - drawHeight) / 2;
      } else {
        // Limitado por alto (barras negras a los lados)
        drawWidth = height * srcRatio;
        offsetX = (width - drawWidth) / 2;
      }

      detections.forEach(detection => {
        const bbox = detection.boundingBox;
        if (!bbox) return;

        // Escalar coordenadas del origen al lienzo visual
        const x = offsetX + (bbox.originX / srcWidth) * drawWidth;
        const y = offsetY + (bbox.originY / srcHeight) * drawHeight;
        const w = (bbox.width / srcWidth) * drawWidth;
        const h = (bbox.height / srcHeight) * drawHeight;

        // Información de la etiqueta
        const category = detection.categories[0];
        const rawLabel = category ? category.categoryName : 'objeto';
        const score = category ? Math.round(category.score * 100) : 0;
        
        // Traducir algunas clases comunes a español
        const translations = {
          'person': 'Persona',
          'dog': 'Perro',
          'cat': 'Gato',
          'bird': 'Ave',
          'chair': 'Silla',
          'laptop': 'Laptop',
          'backpack': 'Mochila',
          'cell phone': 'Celular',
          'bottle': 'Botella'
        };
        const label = translations[rawLabel.toLowerCase()] || rawLabel;
        const displayText = `${label} (${score}%)`;

        // Color según la categoría (Rojo para personas, Azul para animales, Verde para otros)
        let color = '#10b981'; // Verde por defecto
        if (rawLabel.toLowerCase() === 'person') {
          color = '#ef4444'; // Rojo (Seguridad)
        } else if (['dog', 'cat', 'bird', 'horse', 'sheep', 'cow'].includes(rawLabel.toLowerCase())) {
          color = '#3b82f6'; // Azul (Mascotas/Animales)
        }

        // Dibujar el rectángulo
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeRect(x, y, w, h);

        // Dibujar la etiqueta superior
        ctx.fillStyle = color;
        ctx.font = 'bold 13px Roboto, sans-serif';
        const textMetrics = ctx.measureText(displayText);
        const textWidth = textMetrics.width;
        const textHeight = 16;
        
        // Evitar que la etiqueta quede por encima del límite del canvas
        let labelY = y - 6;
        if (labelY - textHeight < 0) {
          labelY = y + textHeight + 6;
        }

        ctx.fillRect(x - 1, labelY - textHeight - 2, textWidth + 12, textHeight + 6);

        // Dibujar el texto de la etiqueta
        ctx.fillStyle = '#ffffff';
        ctx.fillText(displayText, x + 5, labelY);
      });
    };

    detectFrame();

    return () => {
      loopActiveRef.current = false;
      clearCanvas();
    };
  }, [useWebcam, detectorLoading, aiEnabled, cameraConnected]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2, backgroundColor: '#0f172a' }}>
        <CircularProgress size={60} color="primary" />
        <Typography variant="h6" color="textSecondary">Cargando Stream en Vivo...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0f172a', py: 4 }}>
      <Container maxWidth="lg">
        {/* Cabecera */}
        <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/dashboard')}
            sx={{ border: '1px solid rgba(255, 255, 255, 0.12)', color: '#f3f4f6', textTransform: 'none' }}
          >
            Volver al Dashboard
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Videocam color="primary" /> Video con Detección IA
          </Typography>
        </Box>

        {/* Panel de Controles superiores */}
        <Card sx={{ p: 2, mb: 3, backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
            {/* Control de fuente de video */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant={!useWebcam ? "contained" : "outlined"}
                startIcon={<Videocam />}
                onClick={() => setUseWebcam(false)}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                ESP32-CAM
              </Button>
              <Button
                variant={useWebcam ? "contained" : "outlined"}
                startIcon={<CameraAlt />}
                onClick={() => setUseWebcam(true)}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Cámara PC (Pruebas)
              </Button>
            </Stack>

            {/* Estado del Modelo de IA */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              {detectorLoading ? (
                <Chip icon={<CircularProgress size={16} />} label="Cargando Modelo IA..." color="warning" variant="outlined" size="small" />
              ) : detectorError ? (
                <Chip label="Error IA" color="error" size="small" />
              ) : (
                <Chip icon={<SmartToy />} label="IA Lista (MediaPipe)" color="success" variant="outlined" size="small" sx={{ borderColor: '#10b981', color: '#10b981' }} />
              )}

              {/* Interruptor de IA */}
              <FormControlLabel
                control={
                  <Switch 
                    checked={aiEnabled} 
                    onChange={(e) => setAiEnabled(e.target.checked)} 
                    disabled={!!detectorError || detectorLoading}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: '#f3f4f6' }}>
                    Activar Detección
                  </Typography>
                }
              />
            </Stack>
          </Stack>

          {detectorError && (
            <Alert severity="error" sx={{ mt: 1.5, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {detectorError}
            </Alert>
          )}
        </Card>

        {/* Contenedor principal de la Cámara y Detección */}
        <Card sx={{ 
          backgroundColor: '#070a13', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          aspectRatio: '16/9',
          position: 'relative'
        }}>
          {/* VISTA 1: Cámara web de PC */}
          {useWebcam && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scaleX(-1)' }} // Mirror webcam view
            />
          )}

          {/* VISTA 2: ESP32-CAM */}
          {!useWebcam && (
            cameraConnected ? (
              <img 
                ref={imageRef}
                src={streamUrl} 
                alt="ESP32 Live Stream" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  const target = e.target;
                  target.onerror = null;
                  console.warn("Error en el stream de la imagen, reintentando en 3 segundos...");
                  setTimeout(() => {
                    target.onerror = (evt) => {
                      evt.target.onerror = null;
                    };
                    target.src = `${streamUrl}&t=${Date.now()}`;
                  }, 3000);
                }}
              />
            ) : (
              <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <VideocamOff sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                  Sin conexión con la cámara física
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 450, mx: 'auto', textAlign: 'center' }}>
                  Verifique que la ESP32-CAM esté encendida y conectada, o use el botón superior "Cámara PC" para probar la detección local.
                </Typography>
              </Box>
            )
          )}

          {/* CAPA TRANSPARENTE: Bounding boxes */}
          <canvas
            ref={canvasRef}
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              pointerEvents: 'none',
              transform: useWebcam ? 'scaleX(-1)' : 'none' // Mirror canvas too if webcam is active
            }}
          />

          {/* Indicador superior izquierdo de estado de vídeo en vivo */}
          {((useWebcam) || (!useWebcam && cameraConnected)) && (
            <Box sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              backgroundColor: useWebcam ? 'rgba(59, 130, 246, 0.85)' : 'rgba(16, 185, 129, 0.85)',
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontSize: '11px',
              fontWeight: 700,
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'white', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              {useWebcam ? 'WEBCAM LOCAL' : 'ESP32 VIVO'}
            </Box>
          )}

          {/* Indicador de número de detecciones */}
          {aiEnabled && detectedObjects.length > 0 && (
            <Box sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f3f4f6',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontSize: '12px',
              fontWeight: 500,
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Pets sx={{ fontSize: 16, color: '#10b981' }} />
              Detecciones: {detectedObjects.length}
            </Box>
          )}
        </Card>
      </Container>
    </Box>
  );
}

export default LiveStream;
