// Utilidad para persistir y obtener datos del LocalStorage de forma sencilla
export const uselocalStorage = {
  // Guarda un objeto convirtiéndolo en string JSON
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  // Obtiene el objeto parseado o retorna null si no existe
  get(key) {
    return localStorage.getItem(key)
      ? JSON.parse(localStorage.getItem(key))
      : null;
  },
  // Elimina una clave del almacenamiento local
  delete(key) {
    localStorage.removeItem(key);
  }
};
