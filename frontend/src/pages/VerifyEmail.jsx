import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TextMUI from '../componets/TextMUI';
import ButtonMui from '../componets/ButtonMui';
import { authAPI } from '../models/apiService';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verificando tu correo electrónico...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no proporcionado.');
      return;
    }

    const verify = async () => {
      try {
        const res = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Correo verificado con éxito. Ya puedes iniciar sesión.');
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Token inválido o expirado.');
      }
    };

    verify();
  }, [token]);

  return (
    <Container maxWidth="sm" sx={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
      <Card sx={{ padding: 4, borderRadius: 4, backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          {status === 'loading' && <CircularProgress color="primary" sx={{ mb: 2 }} />}
          {status === 'success' && <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />}
          {status === 'error' && <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />}
          
          <TextMUI value={status === 'loading' ? 'Verificando' : (status === 'success' ? '¡Verificado!' : 'Error de Verificación')} variant="h5" color="primary" />
          <TextMUI value={message} variant="body1" color="textSecondary" sx={{ mt: 2 }} />
        </Box>
        
        {status !== 'loading' && (
          <ButtonMui text="Ir al Inicio de Sesión" onClick={() => navigate('/ingreso')} />
        )}
      </Card>
    </Container>
  );
}

export default VerifyEmailPage;
