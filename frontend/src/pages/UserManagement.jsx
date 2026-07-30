import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, CircularProgress, Alert } from '@mui/material';
import { usersAPI } from '../models/apiService';
import { uselocalStorage } from '../storage/uselocalStorage';
import { useNavigate } from 'react-router-dom';

function UserManagementPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const sessionUser = uselocalStorage.get('user');

  useEffect(() => {
    if (!sessionUser || sessionUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchClients();
  }, [navigate]); // No incluir sessionUser para evitar el bucle infinito, ya que siempre es un nuevo objeto

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getClients(sessionUser.token);
      setClients(data.clients || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la lista de usuarios. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccess = async (username, currentValue) => {
    try {
      // Optimistic update
      setClients(clients.map(c => c.correo === username ? { ...c, can_view_camera: !currentValue } : c));
      await usersAPI.updateCameraAccess(sessionUser.token, username, !currentValue);
    } catch (err) {
      console.error(err);
      // Revert on error
      setClients(clients.map(c => c.correo === username ? { ...c, can_view_camera: currentValue } : c));
      alert('Error al actualizar el permiso.');
    }
  };

  if (!sessionUser || sessionUser.role !== 'admin') return null;

  return (
    <Box sx={{ p: 4, maxWidth: '900px', margin: '0 auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 4, fontWeight: 'bold' }}>
        Gestión de Accesos a la Cámara
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ backgroundColor: '#1e293b', color: '#fff' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Correo</TableCell>
              <TableCell align="center" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>¿Puede ver la cámara?</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress color="primary" />
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: '#cbd5e1', py: 4 }}>
                  No hay clientes registrados en el sistema.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.correo} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ color: '#cbd5e1' }}>{client.id_usuario}</TableCell>
                  <TableCell sx={{ color: '#cbd5e1' }}>{client.primer_nombre} {client.primer_apellido}</TableCell>
                  <TableCell sx={{ color: '#cbd5e1' }}>{client.correo}</TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={client.can_view_camera || false}
                      onChange={() => handleToggleAccess(client.correo, client.can_view_camera)}
                      color="primary"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default UserManagementPage;
