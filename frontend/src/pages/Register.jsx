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
import { userModel } from '../models/userModel';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';

/**
 * RegisterPage - Componente para el registro de nuevos usuarios
 * Mantiene los campos y validaciones de botón del proyecto hoteles
 */
function RegisterPage() {
  // Declaración de estados para los campos del formulario
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasLength = password.length >= 8;
  const isPasswordValid = hasUppercase && hasNumber && hasLength;

  const navigate = useNavigate();

  // Función ejecutada al enviar el registro
  const handleSendForm = async () => {
    const res = await userModel.register(firstName, middleName, lastName, secondLastName, address, mobile, email, password);
    
    if (res.success) {
      alert(`${res.message} Ya puedes ingresar con tu correo.`);
      navigate("/ingreso"); // Redirige a la pantalla de ingreso
    } else {
      alert(res.message);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100vh",
        paddingY: 4
      }}
    >
      <Card
        sx={{
          padding: 4,
          borderRadius: 4,
          backgroundColor: '#1e293b', // Estilo dark blue premium
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Cabecera del formulario de registro */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <AppRegistrationIcon color="primary" sx={{ fontSize: 50, mb: 1 }} />
          <TextMUI value="Crear Cuenta" variant="h5" color="primary" />
          <TextMUI value="Únete al sistema de seguridad inteligente" variant="caption" color="textSecondary" />
        </Box>

        {/* Campos del formulario estructurados en Grid */}
        <Grid container spacing={2}>
          {/* Campo de Primer Nombre */}
          <Grid item xs={12} sm={6}>
            <TextFieldMui
              label="Primer Nombre *"
              placeholder="Ingrese su primer nombre"
              value={firstName}
              onChange={setFirstName}
              id="firstName"
            />
          </Grid>

          {/* Campo de Segundo Nombre */}
          <Grid item xs={12} sm={6}>
            <TextFieldMui
              label="Segundo Nombre"
              placeholder="Ingrese su segundo nombre (opcional)"
              value={middleName}
              onChange={setMiddleName}
              id="middleName"
            />
          </Grid>

          {/* Campo de Primer Apellido */}
          <Grid item xs={12} sm={6}>
            <TextFieldMui
              label="Primer Apellido *"
              placeholder="Ingrese su primer apellido"
              value={lastName}
              onChange={setLastName}
              id="lastName"
            />
          </Grid>

          {/* Campo de Segundo Apellido */}
          <Grid item xs={12} sm={6}>
            <TextFieldMui
              label="Segundo Apellido"
              placeholder="Ingrese su segundo apellido (opcional)"
              value={secondLastName}
              onChange={setSecondLastName}
              id="secondLastName"
            />
          </Grid>

          {/* Campo de Dirección */}
          <Grid item xs={12} sm={6}>
            <TextFieldMui
              label="Dirección"
              placeholder="Ingrese su dirección"
              value={address}
              onChange={setAddress}
              id="address"
            />
          </Grid>

          {/* Campo de Teléfono */}
          <Grid item xs={12} sm={6}>
            <TextFieldMui
              label="Número de teléfono"
              placeholder="Ingrese su número"
              value={mobile}
              onChange={setMobile}
              id="mobile"
            />
          </Grid>

          {/* Campo de Correo */}
          <Grid item xs={12} sm={6}>
            <TextFieldMui
              label="Correo electrónico"
              placeholder="Ingrese su email"
              type="email"
              value={email}
              onChange={setEmail}
              id="email"
            />
          </Grid>

          {/* Campo de Contraseña */}
          <Grid item xs={12} sm={6}>
            <PasswordInput
              label="Contraseña *"
              value={password}
              onChange={setPassword}
              id="password"
            />
            {password && (
              <Box sx={{ mt: 1, px: 1, fontSize: '0.8rem' }}>
                <div style={{ color: hasLength ? '#4caf50' : '#f44336' }}>
                  {hasLength ? '✓' : '✗'} Mínimo 8 caracteres
                </div>
                <div style={{ color: hasUppercase ? '#4caf50' : '#f44336' }}>
                  {hasUppercase ? '✓' : '✗'} Al menos una mayúscula
                </div>
                <div style={{ color: hasNumber ? '#4caf50' : '#f44336' }}>
                  {hasNumber ? '✓' : '✗'} Al menos un número
                </div>
              </Box>
            )}
          </Grid>

          {/* Botón de envío de formulario con validación */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <ButtonMui
              text="REGISTRARSE"
              onClick={handleSendForm}
              disabled={
                firstName.length < 2 ||
                lastName.length < 2 ||
                address.length <= 2 ||
                mobile.length <= 5 ||
                email.length <= 5 ||
                !isPasswordValid
              }
            />
          </Grid>

          {/* Enlace para volver a la pantalla de ingreso */}
          <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
            <TextMUI
              onClick={() => navigate("/ingreso")}
              sx={{ cursor: "pointer", textDecoration: 'underline' }}
              value="¿Ya tienes cuenta? Ingresa aquí"
              variant="body2"
              color="primary"
            />
          </Grid>
        </Grid>
      </Card>
    </Container>
  );
}

export default RegisterPage;
