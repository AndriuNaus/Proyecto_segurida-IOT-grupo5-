import { uselocalStorage } from '../storage/uselocalStorage';

// Modelo de datos de usuario con simulación de persistencia local (LocalStorage)
export const userModel = {
  /**
   * Intenta autenticar un usuario usando localStorage o credenciales por defecto.
   * @param {string} username - Nombre de usuario o correo.
   * @param {string} password - Contraseña.
   * @returns {object|boolean} Objeto de usuario si es exitoso, o false si es inválido.
   */
  login: async (username, password) => {
    // Buscar en la lista de usuarios registrados
    const users = uselocalStorage.get("registered_users") || [];
    const foundUser = users.find(u => (u.email === username || u.usuario === username) && u.password === password);
    
    let userDetails = null;

    if (foundUser) {
      userDetails = {
        name: foundUser.name,
        lastname: foundUser.lastname,
        role: "user",
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

    if (!userDetails) {
      return false;
    }

    try {
      // Llamar al backend para obtener el token JWT real
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fallo de autenticación en servidor.');
      }

      const data = await response.json();
      return {
        ...userDetails,
        token: data.token
      };
    } catch (error) {
      console.error('Error al iniciar sesión en backend:', error);
      // Fallback para cuando el backend no está disponible en desarrollo local
      return {
        ...userDetails,
        token: 'fake-jwt-token-for-local-demo-purposes'
      };
    }
  },

  /**
   * Registra un nuevo usuario guardándolo en la lista local de localStorage.
   */
  register: (name, lastname, address, mobile, email, password) => {
    const users = uselocalStorage.get("registered_users") || [];
    
    // Validar si el correo ya existe
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
    return { success: true, message: "Registro guardado correctamente.", user: newUser };
  }
};
