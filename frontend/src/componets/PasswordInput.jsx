// Componente para campos de contraseña con opción de ocultar/mostrar
import { useState } from 'react';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Visibility, VisibilityOff } from '@mui/icons-material';

/**
 * PasswordInput - Input específico para contraseñas con toggle de visibilidad
 * @param {string} label - Etiqueta
 * @param {string} value - Valor de la contraseña
 * @param {function} onChange - Callback al cambiar el valor
 * @param {string} id - Identificador único
 */
function PasswordInput({ label = "Contraseña", value, onChange, id = 'password' }) {
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  return (
    <TextField
      id={id}
      name={id}
      label={label}
      type={showPassword ? 'text' : 'password'}
      variant='outlined'
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      required
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClickShowPassword}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
        }
      }}
    />
  );
}

export default PasswordInput;
