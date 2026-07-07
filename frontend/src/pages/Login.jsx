import { useState } from 'react';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import { useNavigate } from "react-router-dom";
import PasswordInput from '../componets/PasswordInput';
import TextMUI from '../componets/TextMUI';
import TextFieldMui from '../componets/TextFieldMui';
import ButtonMui from '../componets/ButtonMui';
import { uselocalStorage } from '../storage/uselocalStorage';
import { userModel } from '../models/userModel';
import SecurityIcon from '@mui/icons-material/Security';

/**
 * LoginPage - Componente para el inicio de sesión
 * Utiliza componentes MUI personalizados para mantener el estilo del proyecto hoteles
 */
function LoginPage() {
  const navigate = useNavigate();
  
  // Estados para capturar los datos del formulario
  const [usuario, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Manejador del envío del formulario
  const handleSendForm = async (event) => {
    event.preventDefault();
    
    try {
      // Intenta hacer login a través del modelo (llamando al backend)
      const resLogin = await userModel.login(usuario, password);
      
      if (!resLogin) {
        alert('Credenciales Incorrectas (Prueba con admin / admin123 o regístrate)');
      } else {
        // Guarda la sesión en localStorage y da la bienvenida
        uselocalStorage.save("user", resLogin);
        alert(`¡Bienvenido al sistema, ${resLogin.name} ${resLogin.lastname}!`);
        // Navegar a la página del Dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      alert(err.message || 'Error al conectar con el servidor para iniciar sesión.');
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Card
        sx={{
          padding: 4,
          borderRadius: 4,
          backgroundColor: '#1e293b', // Fondo oscuro coincidente con el mockup
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Cabecera del formulario con el logotipo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <SecurityIcon color="primary" sx={{ fontSize: 50, mb: 1 }} />
          <TextMUI value="Smart Security" variant="h5" color="primary" />
          <TextMUI value="Monitoreo IoT en Tiempo Real" variant="caption" color="textSecondary" />
        </Box>

        {/* Formulario de Login */}
        <Box component="form" onSubmit={handleSendForm}>
          <Grid container spacing={2}>
            {/* Campo de usuario */}
            <Grid item xs={12}>
              <TextFieldMui
                label="Usuario o Correo"
                placeholder="Ej. admin"
                value={usuario}
                onChange={setEmail}
                id="username"
              />
            </Grid>
            
            {/* Campo de contraseña */}
            <Grid item xs={12}>
              <PasswordInput
                label="Contraseña"
                value={password}
                onChange={setPassword}
              />
            </Grid>
            
            {/* Botón de ingreso */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <ButtonMui
                text="Ingresar"
                onClick={handleSendForm}
                disabled={usuario.length < 3 || password.length < 3}
              />
            </Grid>
            
            {/* Enlace a Registro */}
            <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
              <TextMUI
                onClick={() => navigate("/registro")}
                sx={{ cursor: "pointer", textDecoration: 'underline' }}
                value="¿No tienes una cuenta? Regístrate"
                variant="body2"
                color="primary"
              />
            </Grid>
            
            {/* Enlace para volver a la Landing Page */}
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <TextMUI
                onClick={() => navigate("/")}
                sx={{ cursor: "pointer", mt: 1 }}
                value="Volver al inicio"
                variant="caption"
                color="textSecondary"
              />
            </Grid>
          </Grid>
        </Box>
      </Card>
    </Container>
  );
}

export default LoginPage;
