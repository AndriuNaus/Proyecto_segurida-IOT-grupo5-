import { useState, useEffect } from 'react';
import {
  Card, CardContent, Box, Typography, Button,
  TextField, Divider, IconButton
} from '@mui/material';
import { Pets, Add, Delete } from '@mui/icons-material';
import { mascotasAPI } from '../models/apiService';
import { uselocalStorage } from '../storage/uselocalStorage';

function PetManager() {
  const [pets, setPets] = useState([]);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const user = uselocalStorage.get("user");

  useEffect(() => {
    if (user && user.token) {
      fetchMascotas();
    }
  }, []);

  const fetchMascotas = async () => {
    try {
      const data = await mascotasAPI.getAll(user.token);
      if (data.mascotas) {
        setPets(data.mascotas);
      }
    } catch (err) {
      console.error('Error cargando mascotas:', err);
    }
  };

  const addPet = async () => {
    if (!newName.trim()) return;
    try {
      const data = await mascotasAPI.create(user.token, {
        nombre: newName.trim(),
        tipo: newType.trim() || 'Mascota'
      });
      if (data.mascota) {
        setPets(prev => [...prev, data.mascota]);
        setNewName('');
        setNewType('');
        setShowForm(false);
      }
    } catch (err) {
      console.error('Error agregando mascota:', err);
    }
  };

  const removePet = async (id) => {
    try {
      await mascotasAPI.delete(user.token, id);
      setPets(prev => prev.filter(p => p.id_mascota !== id));
    } catch (err) {
      console.error('Error eliminando mascota:', err);
    }
  };

  return (
    <Card sx={{ height: '100%', mt: 3 }}>
      {/* Header */}
      <Box sx={{
        p: 2.5,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Pets color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Control de Mascotas
          </Typography>
        </Box>
      </Box>

      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Lista de mascotas */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {pets.length === 0 && (
            <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
              No hay mascotas registradas
            </Typography>
          )}
          {pets.map((pet, idx) => (
            <Box key={pet.id_mascota}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    p: 0.8, borderRadius: 2,
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    color: '#10b981'
                  }}>
                    <Pets sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{pet.nombre}</Typography>
                    <Typography variant="caption" color="textSecondary">{pet.tipo}</Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => removePet(pet.id_mascota)} sx={{ color: 'rgba(156,163,175,0.5)' }}>
                  <Delete sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              {idx < pets.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>

        {/* Formulario agregar mascota */}
        {showForm ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
            <TextField
              label="Nombre de mascota"
              size="small"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPet()}
              fullWidth
              autoFocus
            />
            <TextField
              label="Tipo (Perro, Gato...)"
              size="small"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small" onClick={addPet} fullWidth disabled={!newName.trim()}>
                Agregar
              </Button>
              <Button variant="outlined" size="small" onClick={() => { setShowForm(false); setNewName(''); setNewType(''); }} fullWidth>
                Cancelar
              </Button>
            </Box>
          </Box>
        ) : (
          <Button
            startIcon={<Add />}
            variant="outlined"
            size="small"
            onClick={() => setShowForm(true)}
            fullWidth
            sx={{ color: '#3b82f6', borderColor: 'rgba(59,130,246,0.4)' }}
          >
            Agregar Mascota
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default PetManager;
