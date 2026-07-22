import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Container, Grid, Card, CardContent, Box, Typography, Button, TextField,
  Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl,
  List, ListItem, ListItemText, ListItemIcon, Alert, Snackbar, Divider,
  AppBar, Toolbar, IconButton, CircularProgress, Badge, Chip, Slider
} from '@mui/material';
import {
  Security, Videocam, VideocamOff, Settings, Notifications, History,
  PowerSettingsNew, Lock, LockOpen, Lightbulb, VolumeUp, VolumeOff,
  Refresh, Logout, Dashboard as DashboardIcon, CheckCircle, Warning
} from '@mui/icons-material';
import { uselocalStorage } from '../storage/uselocalStorage';
import { cameraModel } from '../models/cameraModel';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cameraConnected, setCameraConnected] = useState(false);
  const [cameraConfig, setCameraConfig] = useState({
    resolution: 'VGA',
    streamQuality: 30,
    motionDetection: false,
    esp32CamUrl: 'http://192.168.1.100:81/stream'
  });

  // UI state
  const [lockStatus, setLockStatus] = useState(true); // true = locked, false = unlocked
  const [lightsStatus, setLightsStatus] = useState(false);
  const [sirenStatus, setSirenStatus] = useState(false);
  const [alerts, setAlerts] = useState([
    { id: 1, text: "Sistema armado correctamente.", type: "info", time: "Hace un momento" },
    { id: 2, text: "Monitoreo iniciado.", type: "success", time: "Hace 2 minutos" }
  ]);
  const [videoFrame, setVideoFrame] = useState('');
  const [useSimulator, setUseSimulator] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [fps, setFps] = useState(0);

  // References
  const socketRef = useRef(null);
  const canvasRef = useRef(null);
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef(null);

  // Authenticate user on mount
  useEffect(() => {
    const sessionUser = uselocalStorage.get("user");
    if (!sessionUser || !sessionUser.token) {
      navigate('/ingreso');
      return;
    }
    setUser(sessionUser);
    fetchCameraStatus(sessionUser.token);
  }, [navigate]);

  // Fetch camera status using cameraModel
  const fetchCameraStatus = async (token) => {
    try {
      const result = await cameraModel.getStatus(token);
      if (result.status === 'success') {
        setCameraConnected(result.data.isConnected);
        setCameraConfig(result.data.config);
        // If camera is physically connected, turn off simulator by default
        if (result.data.isConnected) {
          setUseSimulator(false);
        }
      }
    } catch (err) {
      console.error("Error al obtener estado de cámara:", err);
      showToast("No se pudo conectar con la API de la cámara. Usando simulador.", "warning");
    } finally {
      setLoading(false);
    }
  };

  // Configurar el stream de video y el sondeo de estado
  useEffect(() => {
    if (!user) return;

    // Establecer la URL del stream usando el modelo de la cámara
    setVideoFrame(cameraModel.getStreamUrl(user.token));

    // Sondeo periódico para verificar si la cámara sigue conectada
    const statusInterval = setInterval(() => {
      fetchCameraStatus(user.token);
    }, 5000);

    // Conexión WebSockets
    socketRef.current = io(window.location.origin);

    socketRef.current.on('connect', () => {
      console.log('Conectado a WebSockets del Backend');
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(statusInterval);
    };
  }, [user]);

  // CCTV Simulator Canvas Loop
  useEffect(() => {
    if (!useSimulator) return;

    let animationId;
    let particleY = 50;
    let particleDirection = 1;

    const drawSimulation = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Background - Dark metallic tone
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      // Grid overlay
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw simulated camera view
      ctx.save();
      
      // Moving simulated target (sensor)
      particleY += 1.5 * particleDirection;
      if (particleY > height - 100 || particleY < 100) {
        particleDirection *= -1;
        // Trigger simulated motion event randomly on boundary bounce
        if (Math.random() > 0.4 && cameraConfig.motionDetection) {
          triggerSimulatedMotion();
        }
      }

      // Draw a grid pattern or "Room" geometry
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Wall lines
      ctx.moveTo(50, 50); ctx.lineTo(150, 100);
      ctx.moveTo(150, 100); ctx.lineTo(150, 300);
      ctx.moveTo(150, 300); ctx.lineTo(50, 350);
      ctx.moveTo(width - 50, 50); ctx.lineTo(width - 150, 100);
      ctx.moveTo(width - 150, 100); ctx.lineTo(width - 150, 300);
      ctx.moveTo(width - 150, 300); ctx.lineTo(width - 50, 350);
      ctx.stroke();

      // Draw a simulated camera target/box
      ctx.strokeStyle = lightsStatus ? 'rgba(16, 185, 129, 0.6)' : 'rgba(59, 130, 246, 0.6)';
      ctx.strokeRect(width / 2 - 60, particleY - 30, 120, 60);
      
      // Target text info
      ctx.fillStyle = lightsStatus ? '#10b981' : '#3b82f6';
      ctx.font = '10px Courier New';
      ctx.fillText(`OBJ_ID: ESP32-DEV`, width / 2 - 50, particleY - 18);
      ctx.fillText(`STATUS: MONITOREANDO`, width / 2 - 50, particleY - 5);
      ctx.fillText(`MOTION_PROB: ${(60 + Math.random() * 20).toFixed(1)}%`, width / 2 - 50, particleY + 8);
      
      // Draw crosshairs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(width / 2, 20); ctx.lineTo(width / 2, height - 20);
      ctx.moveTo(20, height / 2); ctx.lineTo(width - 20, height / 2);
      ctx.stroke();

      // Corner borders (Retro CCTV style)
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      const cornerLength = 30;
      // Top Left
      ctx.beginPath(); ctx.moveTo(20, 20 + cornerLength); ctx.lineTo(20, 20); ctx.lineTo(20 + cornerLength, 20); ctx.stroke();
      // Top Right
      ctx.beginPath(); ctx.moveTo(width - 20 - cornerLength, 20); ctx.lineTo(width - 20, 20); ctx.lineTo(width - 20, 20 + cornerLength); ctx.stroke();
      // Bottom Left
      ctx.beginPath(); ctx.moveTo(20, height - 20 - cornerLength); ctx.lineTo(20, height - 20); ctx.lineTo(20 + cornerLength, height - 20); ctx.stroke();
      // Bottom Right
      ctx.beginPath(); ctx.moveTo(width - 20 - cornerLength, height - 20); ctx.lineTo(width - 20, height - 20); ctx.lineTo(width - 20, height - 20 - cornerLength); ctx.stroke();

      // Video scanlines effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, width, 1.5);
      }

      // Blinking emergency flash if Siren status is ON
      if (sirenStatus) {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
        ctx.fillRect(0, 0, width, height);
      }

      // HUD Text Info
      ctx.fillStyle = '#10b981';
      ctx.font = '14px Courier New';
      // Blinking red recording dot
      if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(40, 45, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#10b981';
      }
      ctx.fillText("REC LIVE", 55, 50);

      // Draw Timestamp
      const now = new Date();
      ctx.fillText(now.toLocaleString('es-ES'), width - 230, 50);
      
      // Settings stats overlay
      ctx.font = '11px Courier New';
      ctx.fillText(`CAM-RES: ${cameraConfig.resolution}`, 40, height - 60);
      ctx.fillText(`QUALITY: JPEG ${cameraConfig.streamQuality}`, 40, height - 45);
      ctx.fillText(`MOTION DETECT: ${cameraConfig.motionDetection ? 'ON' : 'OFF'}`, 40, height - 30);
      ctx.fillText(`FPS: 30.0 (SIMULADO)`, width - 180, height - 30);

      if (lightsStatus) {
        ctx.fillStyle = '#eab308';
        ctx.fillText("ILUMINACIÓN AUX: ENCENDIDO", width - 220, height - 60);
      } else {
        ctx.fillStyle = '#9ca3af';
        ctx.fillText("ILUMINACIÓN AUX: APAGADO", width - 220, height - 60);
      }

      ctx.restore();

      animationId = requestAnimationFrame(drawSimulation);
    };

    drawSimulation();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [useSimulator, cameraConfig, lightsStatus, sirenStatus]);

  // Trigger simulated motion event
  const triggerSimulatedMotion = () => {
    const timestamp = new Date().toLocaleTimeString('es-ES');
    const newAlert = {
      id: Date.now(),
      text: "¡SIMULADOR: Movimiento detectado en zona crítica!",
      type: "warning",
      time: timestamp
    };
    setAlerts(prev => [newAlert, ...prev.slice(0, 7)]);
    showToast("Alerta: Movimiento detectado (Simulador)", "warning");
    
    // Auto-flash lights or beep if siren is connected
    if (!lightsStatus) {
      setLightsStatus(true);
      setTimeout(() => setLightsStatus(false), 2000);
    }
  };

  // Handle configuration changes
  const handleConfigChange = (field, value) => {
    setCameraConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save Config to Server using cameraModel
  const saveConfiguration = async () => {
    if (user.role !== 'admin') {
      showToast("Solo administradores pueden cambiar la configuración.", "error");
      return;
    }

    try {
      await cameraModel.configure(user.token, cameraConfig);
      showToast("Configuración guardada y aplicada con éxito.", "success");
      
      // Update alerts log
      const timestamp = new Date().toLocaleTimeString('es-ES');
      setAlerts(prev => [{
        id: Date.now(),
        text: `Configuración actualizada: ${cameraConfig.resolution}, Calidad: ${cameraConfig.streamQuality}`,
        type: "info",
        time: timestamp
      }, ...prev]);
    } catch (err) {
      console.error(err);
      showToast(err.message || "No se pudo conectar al servidor para guardar.", "error");
    }
  };

  // Lock / Unlock toggle
  const toggleLock = () => {
    const nextState = !lockStatus;
    setLockStatus(nextState);
    const text = nextState ? "Cerradura eléctrica armada (Bloqueado)." : "Cerradura eléctrica abierta (Desbloqueado).";
    const type = nextState ? "info" : "warning";
    const timestamp = new Date().toLocaleTimeString('es-ES');
    setAlerts(prev => [{ id: Date.now(), text, type, time: timestamp }, ...prev]);
    showToast(text, type);
  };

  // Siren toggle
  const toggleSiren = () => {
    const nextState = !sirenStatus;
    setSirenStatus(nextState);
    const text = nextState ? "Sirena de alarma activada." : "Sirena de alarma desactivada.";
    const type = nextState ? "error" : "info";
    const timestamp = new Date().toLocaleTimeString('es-ES');
    setAlerts(prev => [{ id: Date.now(), text, type, time: timestamp }, ...prev]);
    showToast(text, type);
  };

  // Lights toggle
  const toggleLights = () => {
    const nextState = !lightsStatus;
    setLightsStatus(nextState);
    const text = nextState ? "Luces auxiliares activadas." : "Luces auxiliares desactivadas.";
    const timestamp = new Date().toLocaleTimeString('es-ES');
    setAlerts(prev => [{ id: Date.now(), text, type: "info", time: timestamp }, ...prev]);
    showToast(text, "info");
  };

  // Handle Logout
  const handleLogout = () => {
    uselocalStorage.delete("user");
    showToast("Sesión cerrada.", "info");
    navigate("/ingreso");
  };

  // Toast Helpers
  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <CircularProgress size={60} color="primary" />
        <Typography variant="h6" color="textSecondary">Cargando Panel de Seguridad...</Typography>
      </Box>
    );
  }

  const isAdmin = user && user.role === 'admin';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      
      {/* Header Glassmorphic Bar */}
      <AppBar position="sticky" sx={{
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'none'
      }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Security color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.5px', color: '#f3f4f6' }}>
              Smart Security
            </Typography>
            <Chip 
              label="Control Center" 
              color="primary" 
              size="small" 
              variant="outlined" 
              sx={{ border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6' }} 
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#f3f4f6' }}>
                {user ? `${user.name} ${user.lastname}` : 'Usuario'}
              </Typography>
              <Typography variant="caption" sx={{ textTransform: 'capitalize', color: isAdmin ? '#f43f5e' : '#9ca3af' }}>
                Rol: {user ? user.role : 'Invitado'}
              </Typography>
            </Box>
            <IconButton onClick={handleLogout} color="error" title="Cerrar Sesión" sx={{ border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 2 }}>
              <Logout />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 6, flexGrow: 1 }}>
        
        {/* Connection & Mode Banner */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card sx={{
              background: 'radial-gradient(ellipse at top right, rgba(59, 130, 246, 0.15), rgba(30, 41, 59, 0.95))',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 4
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, py: '16px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Badge variant="dot" color={cameraConnected || useSimulator ? "success" : "error"} overlap="circular">
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 3,
                      backgroundColor: cameraConnected || useSimulator ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: cameraConnected || useSimulator ? '#10b981' : '#f43f5e'
                    }}>
                      <Videocam />
                    </Box>
                  </Badge>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Dispositivo ESP32-CAM: {useSimulator ? "Modo Simulador" : (cameraConnected ? "Conectado" : "Desconectado")}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {useSimulator 
                        ? "Mostrando simulación interactiva local (Ideal para pruebas en AWS)." 
                        : `Transmitiendo desde: ${cameraConfig.esp32CamUrl}`}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={useSimulator} 
                        onChange={(e) => setUseSimulator(e.target.checked)} 
                        color="primary"
                      />
                    }
                    label="Modo Simulador"
                    sx={{ color: '#9ca3af' }}
                  />
                  
                  {!useSimulator && (
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      size="small"
                      onClick={() => fetchCameraStatus(user.token)}
                    >
                      Reconectar
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          
          {/* 1. CCTV Video Stream Viewport */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ 
                p: 2.5, 
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: 'rgba(30, 41, 59, 0.5)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Videocam color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Monitor de Video en Vivo 24/7  
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => navigate('/live')}
                    sx={{ mr: 1, textTransform: 'none', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.4)' }}
                  >
                    Pantalla Completa
                  </Button>
                  {useSimulator ? (
                    <Chip label="DEMO ACTIVA" color="info" size="small" variant="filled" />
                  ) : (
                    <Chip 
                      label={cameraConnected ? "STREAMING EN VIVO" : "SIN CONEXIÓN"} 
                      color={cameraConnected ? "secondary" : "error"} 
                      size="small" 
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ 
                position: 'relative', 
                width: '100%', 
                flexGrow: 1, 
                backgroundColor: '#070a13',
                aspectRatio: '16/9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {useSimulator ? (
                  <canvas 
                    ref={canvasRef} 
                    width={640} 
                    height={360} 
                    style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
                  />
                ) : cameraConnected && videoFrame ? (
                  <img 
                    src={videoFrame} 
                    alt="ESP32 Live Stream" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    onError={(e) => {
                      const target = e.target;
                      target.onerror = null;
                      console.warn("Error en el stream del Dashboard, reintentando en 3 segundos...");
                      setTimeout(() => {
                        target.onerror = (evt) => {
                          evt.target.onerror = null;
                        };
                        target.src = `${videoFrame}&t=${Date.now()}`;
                      }, 3000);
                    }}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <VideocamOff sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                      No se recibe señal de video
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 400, mx: 'auto', mb: 2 }}>
                      Verifique que el microcontrolador ESP32-CAM esté encendido y configurado en la misma red o active el <b>Modo Simulador</b> en el panel superior.
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => setUseSimulator(true)}
                      startIcon={<Security />}
                    >
                      Activar Simulador
                    </Button>
                  </Box>
                )}

                {/* Simulated alert overlay in stream */}
                {sirenStatus && (
                  <Box sx={{
                    position: 'absolute',
                    top: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(244, 63, 94, 0.9)',
                    color: 'white',
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    fontWeight: 700,
                    animation: 'pulse 1s infinite',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    boxShadow: '0 4px 20px rgba(244, 63, 94, 0.4)',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 }
                    }
                  }}>
                    <Warning /> ALARMA SONORA ACTIVADA
                  </Box>
                )}
              </Box>

              {/* Quick Actions Footer for Video */}
              <Box sx={{ p: 2, backgroundColor: 'rgba(30, 41, 59, 0.4)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  Aviso: El streaming de red utiliza el puerto WebSocket estándar.
                </Typography>
                {useSimulator && (
                  <Button 
                    variant="contained" 
                    color="warning" 
                    size="small" 
                    onClick={triggerSimulatedMotion}
                    disabled={!cameraConfig.motionDetection}
                  >
                    Simular Movimiento
                  </Button>
                )}
              </Box>
            </Card>
          </Grid>

          {/* 2. Controls & Actuators Panel */}
          <Grid item xs={12} lg={4}>
            <Grid container spacing={4}>
              
              {/* Telemetry and Relays Control */}
              <Grid item xs={12}>
                <Card>
                  <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PowerSettingsNew color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Control de Actuadores
                    </Typography>
                  </Box>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    
                    {/* Door Lock Button */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1, borderRadius: 2, backgroundColor: lockStatus ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: lockStatus ? '#3b82f6' : '#10b981' }}>
                          {lockStatus ? <Lock /> : <LockOpen />}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Cerradura Inteligente</Typography>
                          <Typography variant="caption" color="textSecondary">
                            Estado: {lockStatus ? "Asegurado (Cerrado)" : "Libre (Abierto)"}
                          </Typography>
                        </Box>
                      </Box>
                      <Button 
                        variant="contained" 
                        color={lockStatus ? "success" : "warning"}
                        size="small"
                        onClick={toggleLock}
                      >
                        {lockStatus ? "Desbloquear" : "Bloquear"}
                      </Button>
                    </Box>

                    <Divider />

                    {/* Aux Lights Button */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1, borderRadius: 2, backgroundColor: lightsStatus ? 'rgba(234, 179, 8, 0.15)' : 'rgba(156, 163, 175, 0.1)', color: lightsStatus ? '#eab308' : '#9ca3af' }}>
                          <Lightbulb />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Reflector de Luz Auxiliar</Typography>
                          <Typography variant="caption" color="textSecondary">
                            Estado: {lightsStatus ? "Encendido" : "Apagado"}
                          </Typography>
                        </Box>
                      </Box>
                      <Button 
                        variant="outlined" 
                        color={lightsStatus ? "warning" : "inherit"}
                        size="small"
                        onClick={toggleLights}
                      >
                        {lightsStatus ? "Apagar" : "Encender"}
                      </Button>
                    </Box>

                    <Divider />

                    {/* Panic Siren Switch */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1, borderRadius: 2, backgroundColor: sirenStatus ? 'rgba(244, 63, 94, 0.15)' : 'rgba(156, 163, 175, 0.1)', color: sirenStatus ? '#f43f5e' : '#9ca3af' }}>
                          {sirenStatus ? <VolumeUp /> : <VolumeOff />}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Sirena de Pánico</Typography>
                          <Typography variant="caption" color="textSecondary">
                            Estado: {sirenStatus ? "ACTIVADA (Buzzer)" : "Desactivada"}
                          </Typography>
                        </Box>
                      </Box>
                      <Button 
                        variant="contained" 
                        color="error"
                        size="small"
                        onClick={toggleSiren}
                        sx={{
                          animation: sirenStatus ? 'blinker 1s linear infinite' : 'none',
                          '@keyframes blinker': {
                            '50%': { opacity: 0.5 }
                          }
                        }}
                      >
                        {sirenStatus ? "DESACTIVAR" : "DISPARAR"}
                      </Button>
                    </Box>

                  </CardContent>
                </Card>
              </Grid>

              {/* Hardware / IoT Config Settings (Admin Only) */}
              <Grid item xs={12}>
                <Card>
                  <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Settings color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Configuración de Cámara
                    </Typography>
                  </Box>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {!isAdmin && (
                      <Alert severity="warning">
                        Solo los administradores pueden editar los parámetros de la cámara.
                      </Alert>
                    )}

                    <FormControl fullWidth disabled={!isAdmin} size="small">
                      <InputLabel id="res-label">Resolución de Imagen</InputLabel>
                      <Select
                        labelId="res-label"
                        label="Resolución de Imagen"
                        value={cameraConfig.resolution}
                        onChange={(e) => handleConfigChange('resolution', e.target.value)}
                      >
                        <MenuItem value="QVGA">QVGA (320x240)</MenuItem>
                        <MenuItem value="VGA">VGA (640x480)</MenuItem>
                        <MenuItem value="SVGA">SVGA (800x600)</MenuItem>
                        <MenuItem value="UXGA">UXGA (1600x1200 - HD)</MenuItem>
                      </Select>
                    </FormControl>

                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                        Factor Calidad Stream JPEG: {cameraConfig.streamQuality} (10 = Mejor, 63 = Menor)
                      </Typography>
                      <Slider
                        disabled={!isAdmin}
                        value={cameraConfig.streamQuality}
                        min={10}
                        max={63}
                        onChange={(e, val) => handleConfigChange('streamQuality', val)}
                        valueLabelDisplay="auto"
                      />
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch 
                          disabled={!isAdmin}
                          checked={cameraConfig.motionDetection} 
                          onChange={(e) => handleConfigChange('motionDetection', e.target.checked)} 
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Detección de Movimiento</Typography>
                          <Typography variant="caption" color="textSecondary">Dispara alertas automáticas ante cambios de píxeles</Typography>
                        </Box>
                      }
                    />

                    <TextField
                      label="Enlace Stream de la ESP32-CAM"
                      placeholder="http://192.168.1.100:81/stream"
                      value={cameraConfig.esp32CamUrl}
                      disabled={!isAdmin}
                      onChange={(e) => handleConfigChange('esp32CamUrl', e.target.value)}
                      fullWidth
                      size="small"
                      helperText="Dirección IP local o pública del stream del microcontrolador."
                    />

                    <Button
                      variant="contained"
                      onClick={saveConfiguration}
                      disabled={!isAdmin}
                      fullWidth
                      startIcon={<CheckCircle />}
                    >
                      Guardar Cambios
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

            </Grid>
          </Grid>

          {/* 3. History Alerts Log */}
          <Grid item xs={12}>
            <Card>
              <Box sx={{ 
                p: 2.5, 
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <History color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Historial de Alertas y Telemetría
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  Mostrando últimos 8 eventos
                </Typography>
              </Box>
              <CardContent sx={{ p: 0 }}>
                <List sx={{ py: 0 }}>
                  {alerts.map((alert, idx) => (
                    <Box key={alert.id}>
                      <ListItem sx={{ py: 1.5, px: 3 }}>
                        <ListItemIcon>
                          {alert.type === 'error' ? (
                            <Warning color="error" />
                          ) : alert.type === 'warning' ? (
                            <Warning color="warning" />
                          ) : alert.type === 'success' ? (
                            <CheckCircle color="secondary" />
                          ) : (
                            <Notifications color="primary" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.text}
                          secondary={alert.time}
                          primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 600 } }}
                        />
                        <Chip
                          label={alert.type.toUpperCase()}
                          size="small"
                          color={alert.type === 'error' ? "error" : alert.type === 'warning' ? "warning" : alert.type === 'success' ? "success" : "default"}
                          variant="outlined"
                          sx={{ textTransform: 'capitalize', fontSize: '10px' }}
                        />
                      </ListItem>
                      {idx < alerts.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.08)', mt: 'auto', backgroundColor: '#1e293b' }}>
        <Typography variant="body2" color="textSecondary" align="center">
          Sistema de Seguridad IoT ESP32-CAM | Desarrollado en Node.js, Socket.io, Express y React MUI.
        </Typography>
      </Box>

      {/* Toast Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}

export default Dashboard;
