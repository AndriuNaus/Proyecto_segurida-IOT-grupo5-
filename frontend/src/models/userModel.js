import { uselocalStorage } from '../storage/uselocalStorage';
import { authAPI } from './apiService';

/**
 * Modelo de datos de usuario conectado con las APIs REST del Backend Express vía apiService.
 */
export const userModel = {
  /**
   * Autentica un usuario contra el backend (/api/auth/login) y genera el token JWT.
   * @param {string} username - Nombre de usuario o correo.
   * @param {string} password - Contraseña.
   * @returns {Promise<object|boolean>} Objeto del usuario con token JWT si es exitoso, o false si es inválido.
   */
  login: async (username, password) => {
    // 1. Intentar autenticación real contra la API del Backend vía authAPI
    try {
      const data = await authAPI.login(username, password);

      if (data && data.token) {
        let role = "cliente";
        let name = username;
        let lastname = "";

        // Decodificar el token JWT recibido para obtener el rol real
        try {
          const payloadBase64 = data.token.split('.')[1];
          const payloadJson = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
          if (payloadJson.role) role = payloadJson.role;
          if (payloadJson.sub) name = payloadJson.sub;
        } catch (e) {
          // Si no se puede decodificar, mantenemos los valores base
        }

        // Buscar datos adicionales en localStorage si existen
        const users = uselocalStorage.get("registered_users") || [];
        const foundUser = users.find(u => u.email === username || u.usuario === username);
        if (foundUser) {
          name = foundUser.name || name;
          lastname = foundUser.lastname || lastname;
        } else if (username === "admin") {
          name = "Administrador";
          lastname = "Global";
        }

        return {
          name,
          lastname,
          role,
          email: username,
          token: data.token
        };
      }
    } catch (error) {
      console.warn('Backend API no disponible o credenciales inválidas en servidor, intentando fallback local...', error.message);
    }

    // 2. Fallback de autenticación local si el backend no responde o para cuentas de prueba local
    const users = uselocalStorage.get("registered_users") || [];
    const foundUser = users.find(u => (u.email === username || u.usuario === username) && u.password === password);
    
    let userDetails = null;

    if (foundUser) {
      userDetails = {
        name: foundUser.name,
        lastname: foundUser.lastname,
        role: "cliente",
        email: foundUser.email
      };
    } else if (username === "admin" && password === "admin123") {
      userDetails = {
        name: "Administrador",
        lastname: "Global",
        role: "admin",
        email: "admin"
      };
    } else if (username === "anyella" && password === "1234") {
      userDetails = {
        name: "Anyela",
        lastname: "Carpio",
        role: "admin",
        email: "anyella"
      };
    }

    if (userDetails) {
      return {
        ...userDetails,
        token: 'fake-jwt-token-for-local-demo-purposes'
      };
    }

    return false;
  },

  /**
   * Registra un nuevo usuario enviando los datos al backend (/api/auth/register) vía authAPI.
   * @param {string} name - Nombres
   * @param {string} lastname - Apellidos
   * @param {string} address - Dirección
   * @param {string} mobile - Teléfono
   * @param {string} email - Correo / usuario
   * @param {string} password - Contraseña
   * @returns {Promise<object>} Resultado de la operación { success, message, user }
   */
  register: async (name, lastname, address, mobile, email, password) => {
    try {
      const username = email;
      const nombreCompleto = `${name} ${lastname}`.trim();

      // 1. Enviar datos a la API Backend de registro vía authAPI
      const data = await authAPI.register({
        username,
        password,
        role: 'cliente',
        nombre: nombreCompleto,
        telefono: mobile,
        direccion: address
      });

      // 2. Guardar copia local en localStorage para sincronización frontend
      const users = uselocalStorage.get("registered_users") || [];
      const newUser = {
        name,
        lastname,
        address,
        mobile,
        email,
        password,
        usuario: email.split('@')[0]
      };
      users.push(newUser);
      uselocalStorage.save("registered_users", users);

      return {
        success: true,
        message: data.message || "Usuario registrado exitosamente en la base de datos.",
        user: newUser
      };
    } catch (error) {
      console.error('Error al conectar con la API de registro:', error);

      // Fallback a localStorage si el servidor no está corriendo
      const users = uselocalStorage.get("registered_users") || [];
      if (users.some(u => u.email === email)) {
        return { success: false, message: "El correo electrónico ya se encuentra registrado." };
      }

      const newUser = {
        name,
        lastname,
        address,
        mobile,
        email,
        password,
        usuario: email.split('@')[0]
      };
      users.push(newUser);
      uselocalStorage.save("registered_users", users);

      return {
        success: true,
        message: error.message || "Registro guardado en modo local.",
        user: newUser
      };
    }
  }
};


