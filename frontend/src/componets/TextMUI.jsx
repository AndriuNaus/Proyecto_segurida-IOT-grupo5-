// Componente de tipografía personalizado basado en MUI
import Typography from '@mui/material/Typography';

/**
 * TextMUI - Componente de tipografía reutilizable
 * @param {string} value - El texto a renderizar
 * @param {string} variant - Variante tipográfica ('h1', 'h2', 'body1', etc.)
 * @param {string} align - Alineación ('center', 'left', 'right', 'justify')
 * @param {string} color - Color ('primary', 'secondary', 'textPrimary', etc.)
 * @param {function} onClick - Callback opcional al hacer click
 * @param {object} sx - Estilos personalizados adicionales
 */
function TextMUI({ value = 'vacio', variant = 'h1', align = 'center', color = 'primary', onClick = () => {}, sx = {} }) {
  return (
    <Typography 
      variant={variant} 
      align={align} 
      color={color} 
      onClick={onClick} 
      sx={{ 
        fontWeight: variant.startsWith('h') ? 600 : 'normal',
        ...sx 
      }}
    >
      {value}
    </Typography>
  );
}

export default TextMUI;
