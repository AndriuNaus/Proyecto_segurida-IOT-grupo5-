// Componente de entrada de texto personalizado basado en MUI
import TextField from '@mui/material/TextField';

/**
 * TextFieldMui - Componente de input reutilizable usando Material-UI
 * @param {string} label - Etiqueta superior del input
 * @param {string} placeholder - Texto de ayuda
 * @param {string} type - Tipo de input ('text', 'email', 'number', 'tel')
 * @param {string} id - ID y nombre del elemento
 * @param {string} value - Valor actual
 * @param {function} onChange - Callback que recibe el nuevo valor de texto
 */
function TextFieldMui({ label = "label", placeholder = 'placeholder', type = 'text', id = 'id', value, onChange }) {
  return (
    <TextField
      id={id}
      name={id}
      type={type}
      label={label}
      placeholder={placeholder}
      variant='outlined'
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      required
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
        }
      }}
    />
  );
}

export default TextFieldMui;
