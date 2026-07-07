import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Grid, Card, CardContent, Button, Typography,
  AppBar, Toolbar, Stack, Avatar, Divider, Chip
} from '@mui/material';
import {
  Security as SecurityIcon,
  FlashOn as FlashOnIcon,
  Router as RouterIcon,
  History as HistoryIcon,
  Lock as LockIcon,
  NotificationsActive as NotificationsActiveIcon,
  Speed as SpeedIcon,
  Dvr as DvrIcon,
  Login as LoginIcon,
  AppRegistration as RegisterIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { uselocalStorage } from '../../storage/uselocalStorage';

function LandiPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const sessionUser = uselocalStorage.get("user");
    if (sessionUser && sessionUser.token) {
      setIsLoggedIn(true);
      setUserName(`${sessionUser.name} ${sessionUser.lastname}`);
    }
  }, []);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f172a',
      backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 40%)',
      display: 'flex',
      flexDirection: 'column',
      color: '#f3f4f6'
    }}>
      
      {/* Dynamic Navbar */}
      <AppBar position="static" sx={{
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: 'none'
      }}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon color="primary" sx={{ fontSize: 32, filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: '#f3f4f6', fontFamily: 'Outfit' }}>
              Smart Security
            </Typography>
            <Chip 
              label="IoT Monitor" 
              size="small" 
              sx={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: 'bold' }} 
            />
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            {isLoggedIn ? (
              <>
                <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{userName}</Typography>
                  <Typography variant="caption" color="textSecondary">Sesión Activa</Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#3b82f6', width: 36, height: 36 }}>{userName.charAt(0)}</Avatar>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/dashboard')}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  Ir al Panel
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="text" 
                  color="inherit" 
                  onClick={() => navigate('/ingreso')}
                  startIcon={<LoginIcon />}
                  sx={{ fontWeight: 600 }}
                >
                  Ingresar
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => navigate('/registro')}
                  startIcon={<RegisterIcon />}
                  sx={{ 
                    borderWidth: '1.5px', 
                    '&:hover': { borderWidth: '1.5px' }
                  }}
                >
                  Registrarse
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 12 }, mb: 8, flexGrow: 1 }}>
        <Grid container spacing={6} alignItems="center">
          
          <Grid item xs={12} lg={7} sx={{ textAlign: { xs: 'center', lg: 'left' } }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.8, borderRadius: 20, backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', mb: 3 }}>
              <SpeedIcon color="primary" sx={{ fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Monitoreo IoT en Tiempo Real
              </Typography>
            </Box>

            <Typography variant="h2" sx={{
              fontWeight: 800,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              lineHeight: 1.1,
              mb: 3,
              fontFamily: 'Outfit',
              letterSpacing: '-1px',
              background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Protege y Monitorea con <span style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ESP32-CAM</span>
            </Typography>

            <Typography variant="h6" sx={{ 
              fontWeight: 400, 
              color: '#94a3b8', 
              mb: 5, 
              lineHeight: 1.6,
              maxWidth: '650px',
              mx: { xs: 'auto', lg: '0' }
            }}>
              Infraestructura centralizada de seguridad y control con transmisión de video de bajísima latencia mediante WebSockets, autenticación JWT robusta y control en tiempo real de sirenas y cerraduras.
            </Typography>

            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2.5} 
              justifyContent={{ xs: 'center', lg: 'flex-start' }}
              sx={{ mb: 6 }}
            >
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                onClick={() => navigate(isLoggedIn ? '/dashboard' : '/ingreso')}
                sx={{
                  py: 1.8,
                  px: 4,
                  fontSize: '1.05rem',
                  borderRadius: 3,
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 30px rgba(59, 130, 246, 0.45)',
                  }
                }}
                endIcon={<ArrowForwardIcon />}
              >
                {isLoggedIn ? "Acceder al Panel" : "Iniciar Sesión en el Panel"}
              </Button>

              {!isLoggedIn && (
                <Button 
                  variant="outlined" 
                  color="inherit"
                  size="large"
                  onClick={() => navigate('/registro')}
                  sx={{
                    py: 1.8,
                    px: 4,
                    fontSize: '1.05rem',
                    borderRadius: 3,
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  Registrar Cuenta
                </Button>
              )}
            </Stack>

            {/* Quick Stats Metrics Banner */}
            <Grid container spacing={3} sx={{ justifyContent: { xs: 'center', lg: 'flex-start' } }}>
              <Grid item xs={4} sm={3}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#3b82f6', fontFamily: 'Outfit' }}>&lt; 80ms</Typography>
                <Typography variant="caption" color="textSecondary">Latencia Stream</Typography>
              </Grid>
              <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'rgba(255,255,255,0.08)' }}>
                <Divider orientation="vertical" flexItem />
              </Grid>
              <Grid item xs={4} sm={3}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981', fontFamily: 'Outfit' }}>100%</Typography>
                <Typography variant="caption" color="textSecondary">Hardware Cripto</Typography>
              </Grid>
              <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'rgba(255,255,255,0.08)' }}>
                <Divider orientation="vertical" flexItem />
              </Grid>
              <Grid item xs={4} sm={3}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#06b6d4', fontFamily: 'Outfit' }}>Full HD</Typography>
                <Typography variant="caption" color="textSecondary">Soporte UXGA</Typography>
              </Grid>
            </Grid>

          </Grid>

          {/* Futuristic Visual Mockup Device (Floating Dashboard Preview) */}
          <Grid item xs={12} lg={5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{
              position: 'relative',
              borderRadius: 5,
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              p: 3,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.15)',
              transform: 'perspective(1000px) rotateY(-8deg) rotateX(4deg)',
              transition: 'transform 0.4s ease',
              '&:hover': {
                transform: 'perspective(1000px) rotateY(-2deg) rotateX(1deg)',
              }
            }}>
              {/* Device browser header bar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, pb: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f43f5e' }} />
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#eab308' }} />
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
                <Box sx={{ ml: 2, px: 2, py: 0.4, borderRadius: 1.5, backgroundColor: 'rgba(0,0,0,0.3)', width: '200px', display: 'flex', alignItems: 'center' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '9px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    https://console.smartsecurity.local
                  </Typography>
                </Box>
              </Box>

              {/* Mockup Camera Feed Interface */}
              <Card sx={{ border: '1px solid rgba(59, 130, 246, 0.3)', backgroundColor: '#070a13', overflow: 'hidden', mb: 2 }}>
                <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Grid lines and scan line effect */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 50%, transparent 50%)',
                    backgroundSize: '100% 4px',
                    pointerEvents: 'none'
                  }} />
                  {/* CCTV overlays */}
                  <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f43f5e', animation: 'blink 1s infinite', '@keyframes blink': { '50%': { opacity: 0.3 } } }} />
                    <Typography variant="caption" sx={{ color: '#10b981', fontFamily: 'monospace', fontSize: '9px' }}>LIVE // ESP32_STREAM</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ position: 'absolute', top: 12, right: 12, color: '#10b981', fontFamily: 'monospace', fontSize: '9px' }}>CAM_01 // SECURE_LINK</Typography>
                  
                  {/* Simulated Object outline */}
                  <Box sx={{ width: 140, height: 80, border: '1.5px solid #3b82f6', borderRadius: 1, display: 'flex', flexDirection: 'column', p: 1, backgroundColor: 'rgba(59,130,246,0.05)' }}>
                    <Typography variant="caption" sx={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: '8px', fontWeight: 'bold' }}>OBJ_DETECTED: TARGET_01</Typography>
                    <Typography variant="caption" sx={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: '8px' }}>CONFIDENCE: 98.4%</Typography>
                    <Typography variant="caption" sx={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: '8px' }}>STATUS: MOVING</Typography>
                  </Box>
                </Box>
              </Card>

              {/* Relays controls simulation mockup */}
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>Cerradura</Typography>
                    <Chip label="Asegurada" color="primary" size="small" sx={{ height: 16, fontSize: '8px' }} />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>Alarma</Typography>
                    <Chip label="OK" color="secondary" size="small" sx={{ height: 16, fontSize: '8px' }} />
                  </Box>
                </Grid>
              </Grid>

            </Box>
          </Grid>

        </Grid>

        {/* Feature Cards Grid */}
        <Box sx={{ mt: 16 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, fontFamily: 'Outfit' }}>
              Características Avanzadas
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
              Diseñado con tecnologías modernas y altos estándares de seguridad para garantizar una integración óptima con el hardware IoT.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            
            {/* Feature 1 */}
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                p: 3, 
                height: '100%', 
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  borderColor: 'rgba(59, 130, 246, 0.4)',
                  boxShadow: '0 12px 30px rgba(59, 130, 246, 0.1)'
                }
              }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 1 }}>
                  <Box sx={{ 
                    p: 1.8, 
                    borderRadius: 3, 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                    color: '#3b82f6',
                    alignSelf: 'flex-start',
                    mb: 3
                  }}>
                    <FlashOnIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, fontFamily: 'Outfit' }}>
                    Transmisión en Tiempo Real
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                    Redireccionamiento proxy directo del flujo de video MJPEG del módulo ESP32-CAM retransmitido eficientemente mediante sockets con compresión adaptativa.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Feature 2 */}
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                p: 3, 
                height: '100%', 
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  boxShadow: '0 12px 30px rgba(16, 185, 129, 0.1)'
                }
              }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 1 }}>
                  <Box sx={{ 
                    p: 1.8, 
                    borderRadius: 3, 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                    color: '#10b981',
                    alignSelf: 'flex-start',
                    mb: 3
                  }}>
                    <RouterIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, fontFamily: 'Outfit' }}>
                    Controlador de Actuadores
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                    Integra relés inteligentes y pines GPIO para accionar luces de emergencia, bloquear cerraduras eléctricas de puertas y activar alarmas audibles desde la consola web.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Feature 3 */}
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                p: 3, 
                height: '100%', 
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  borderColor: 'rgba(6, 182, 212, 0.4)',
                  boxShadow: '0 12px 30px rgba(6, 182, 212, 0.1)'
                }
              }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 1 }}>
                  <Box sx={{ 
                    p: 1.8, 
                    borderRadius: 3, 
                    backgroundColor: 'rgba(6, 182, 212, 0.1)', 
                    color: '#06b6d4',
                    alignSelf: 'flex-start',
                    mb: 3
                  }}>
                    <HistoryIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, fontFamily: 'Outfit' }}>
                    Auditoría de Seguridad (JWT)
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                    Historial de eventos de sensores y registro estricto firmado por JSON Web Tokens en backend para certificar que cada comando es emitido por personal autorizado.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </Box>

      </Container>

      {/* Footer */}
      <Box sx={{ p: 4, borderTop: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: '#1e293b', mt: 10 }}>
        <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="textSecondary">
            © 2026 Smart Security - IoT Project Grupo 5. Todos los derechos reservados.
          </Typography>
          <Stack direction="row" spacing={3}>
            <Typography variant="caption" color="textSecondary" sx={{ cursor: 'pointer', '&:hover': { color: '#3b82f6' } }}>Privacidad</Typography>
            <Typography variant="caption" color="textSecondary" sx={{ cursor: 'pointer', '&:hover': { color: '#3b82f6' } }}>Condiciones</Typography>
            <Typography variant="caption" color="textSecondary" sx={{ cursor: 'pointer', '&:hover': { color: '#3b82f6' } }}>Documentación API</Typography>
          </Stack>
        </Container>
      </Box>

    </Box>
  );
}

export default LandiPage;
