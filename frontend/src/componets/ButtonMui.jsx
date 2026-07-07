// Componente de botón personalizado basado en MUI
import Button from '@mui/material/Button';

/**
 * ButtonMui - Componente de botón reusable utilizando Material-UI
 * @param {string} text - Texto a mostrar en el botón
 * @param {string} size - Tamaño ('small', 'medium', 'large')
 * @param {string} color - Color ('primary', 'secondary', 'success', 'error', 'info', 'warning')
 * @param {string} variant - Variante de estilo ('text', 'outlined', 'contained')
 * @param {function} onClick - Función callback al hacer click
 * @param {boolean} disabled - Si está deshabilitado o no
 */
function ButtonMui({ text = 'Default', size = 'medium', color = 'primary', variant = 'contained', onClick, disabled = false }) {
  return (
    <Button 
      variant={variant} 
      color={color} 
      size={size} 
      onClick={onClick} 
      disabled={disabled}
      fullWidth
      sx={{
        borderRadius: '8px',
        padding: size === 'large' ? '12px' : '8px 16px',
        fontWeight: 'bold',
        textTransform: 'none'
      }}
    >
      {text}
    </Button>
  );
}

export default ButtonMui;
