import { useState, useEffect } from 'react';
import {
  Card, CardContent, Box, Typography, Button,
  Switch, TextField, Chip, Divider, IconButton
} from '@mui/material';
import { Home, PersonAdd, Person, Delete } from '@mui/icons-material';

const STORAGE_KEY = 'iot_residents';

const DEFAULT_RESIDENTS = [
  { id: 1, fullName: 'Residente 1', role: 'Familiar', isAtHome: true },
];

function ResidentManager() {
  const [residents, setResidents] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_RESIDENTS;
    } catch {
      return DEFAULT_RESIDENTS;
    }
  });

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Persistir en localStorage y actualizar home_mode para otras páginas
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(residents));
    const anyoneHome = residents.some(r => r.isAtHome);
    localStorage.setItem('home_mode', anyoneHome ? 'EN_CASA' : 'AUSENTE');
  }, [residents]);

  const atHomeCount = residents.filter(r => r.isAtHome).length;
  const isAnyoneHome = atHomeCount > 0;

  const togglePresence = (id) => {
    setResidents(prev => prev.map(r => r.id === id ? { ...r, isAtHome: !r.isAtHome } : r));
  };

  const addResident = () => {
    if (!newName.trim()) return;
    setResidents(prev => [...prev, {
      id: Date.now(),
      fullName: newName.trim(),
      role: newRole.trim() || 'Familiar',
      isAtHome: true,
    }]);
    setNewName('');
    setNewRole('');
    setShowForm(false);
  };

  const removeResident = (id) => {
    setResidents(prev => prev.filter(r => r.id !== id));
  };

  return (
    <Card sx={{ height: '100%' }}>
      {/* Header */}
      <Box sx={{
        p: 2.5,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Home color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Control de Residentes
          </Typography>
        </Box>
        <Chip
          label={isAnyoneHome ? `🟢 ${atHomeCount}/${residents.length} En Casa` : '🔴 Casa Vacía'}
          color={isAnyoneHome ? 'success' : 'error'}
          size="small"
          variant="filled"
          sx={{ fontWeight: 700 }}
        />
      </Box>

      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Modo del Hogar Banner */}
        <Box sx={{
          p: 1.5, borderRadius: 2,
          backgroundColor: isAnyoneHome ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
          border: `1px solid ${isAnyoneHome ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
          textAlign: 'center'
        }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: isAnyoneHome ? '#10b981' : '#f43f5e' }}>
            {isAnyoneHome
              ? '🏠 MODO EN CASA — Actividad familiar normal'
              : '🚨 MODO AUSENTE — Detección = INTRUSIÓN CRÍTICA'}
          </Typography>
        </Box>

        {/* Lista de residentes */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {residents.length === 0 && (
            <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
              No hay residentes registrados
            </Typography>
          )}
          {residents.map((resident, idx) => (
            <Box key={resident.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    p: 0.8, borderRadius: 2,
                    backgroundColor: resident.isAtHome ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                    color: resident.isAtHome ? '#10b981' : '#6b7280'
                  }}>
                    <Person sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{resident.fullName}</Typography>
                    <Typography variant="caption" color="textSecondary">{resident.role}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ color: resident.isAtHome ? '#10b981' : '#6b7280', minWidth: 48, textAlign: 'right' }}>
                    {resident.isAtHome ? 'En Casa' : 'Ausente'}
                  </Typography>
                  <Switch
                    size="small"
                    checked={resident.isAtHome}
                    onChange={() => togglePresence(resident.id)}
                    color="success"
                  />
                  <IconButton size="small" onClick={() => removeResident(resident.id)} sx={{ color: 'rgba(156,163,175,0.5)', ml: 0.5 }}>
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
              {idx < residents.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>

        {/* Formulario agregar residente */}
        {showForm ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
            <TextField
              label="Nombre completo"
              size="small"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addResident()}
              fullWidth
              autoFocus
            />
            <TextField
              label="Parentesco (Padre, Madre, Hijo...)"
              size="small"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small" onClick={addResident} fullWidth disabled={!newName.trim()}>
                Agregar
              </Button>
              <Button variant="outlined" size="small" onClick={() => { setShowForm(false); setNewName(''); setNewRole(''); }} fullWidth>
                Cancelar
              </Button>
            </Box>
          </Box>
        ) : (
          <Button
            startIcon={<PersonAdd />}
            variant="outlined"
            size="small"
            onClick={() => setShowForm(true)}
            fullWidth
            sx={{ color: '#3b82f6', borderColor: 'rgba(59,130,246,0.4)' }}
          >
            Agregar Residente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ResidentManager;
