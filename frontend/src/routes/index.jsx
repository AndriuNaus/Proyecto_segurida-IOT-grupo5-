// Definición de las rutas principales del sistema de seguridad
import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/Login";
import RegisterPage from "../pages/Register";
import LandiPage from "../pages/user/Landing";
import DashboardPage from "../pages/Dashboard";

/**
 * AppRoutes - Administrador de rutas con React Router
 * Define los endpoints para el ingreso, registro, la página de presentación (landing) y el panel
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Ruta para el inicio de sesión */}
      <Route path="ingreso" element={<LoginPage />} />
      
      {/* Ruta para el formulario de registro */}
      <Route path="registro" element={<RegisterPage />} />
      
      {/* Ruta para el panel de control y monitoreo */}
      <Route path="dashboard" element={<DashboardPage />} />
      
      {/* Ruta raíz para la landing page */}
      <Route path="/" element={<LandiPage />} />
      
      {/* Manejo de rutas no existentes (404) */}
      <Route path="*" element={<div style={{ padding: '40px', textAlign: 'center' }}><h1>Página no encontrada</h1></div>} />
    </Routes>
  );
}

export default AppRoutes;
