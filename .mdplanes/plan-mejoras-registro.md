# Plan de Mejoras para el Registro de Usuarios

Este plan detalla los pasos necesarios para implementar las mejoras solicitadas en el proceso de creación de cuentas: validación avanzada de contraseñas, separación de campos de nombres/apellidos y verificación por correo electrónico.

## 1. Cambios en la Base de Datos
*   **Modificar la tabla/modelo de Usuarios:**
    *   Reemplazar los campos genéricos `nombres` y `apellidos` por:
        *   `primer_nombre` (String, Requerido)
        *   `segundo_nombre` (String, Opcional)
        *   `primer_apellido` (String, Requerido)
        *   `segundo_apellido` (String, Opcional)
    *   Agregar campos para la verificación de correo:
        *   `is_verified` (Boolean, por defecto: `false`)
        *   `verification_token` (String, por defecto: `null`)

## 2. Cambios en el Backend (API)
*   **Validación de Datos (Registro):**
    *   Asegurar que se reciban los nuevos campos de nombre/apellido.
    *   Implementar validación fuerte de contraseña mediante expresiones regulares (RegEx):
        *   Mínimo 8 caracteres.
        *   Al menos una letra mayúscula.
        *   Al menos un número.
*   **Lógica de Registro:**
    *   Al crear el usuario, generar un token de verificación único (ej. usando `crypto` o `uuid`).
    *   Guardar el usuario con `is_verified = false` y asignar el `verification_token`.
    *   Integrar un servicio de envío de correos (ej. `Nodemailer` con Gmail, SendGrid, Resend, etc.) para enviar un email al usuario con un enlace: `http://tudominio.com/verificar?token=EL_TOKEN_AQUI`.
*   **Nuevo Endpoint de Verificación:**
    *   Crear ruta `GET /api/auth/verify/:token`.
    *   Buscar en la base de datos el usuario con ese token.
    *   Si existe, actualizar `is_verified = true` y eliminar el `verification_token`.
    *   Redirigir al frontend con un mensaje de éxito.
*   **Lógica de Inicio de Sesión (Login):**
    *   Antes de permitir el login, verificar que `is_verified === true`.
    *   Si es `false`, devolver un error: "Por favor verifica tu correo electrónico antes de iniciar sesión."

## 3. Cambios en el Frontend (Interfaz de Usuario)
*   **Actualizar el Formulario de Registro:**
    *   Cambiar los inputs actuales ("Nombres", "Apellidos") a 4 inputs separados:
        1.  Primer Nombre (*)
        2.  Segundo Nombre
        3.  Primer Apellido (*)
        4.  Segundo Apellido
    *   **Validación visual de contraseña:** Mostrar un mensaje o indicadores visuales mientras el usuario escribe, para que sepa si cumple con la mayúscula y la longitud mínima requerida.
*   **Manejo de Respuestas:**
    *   Al enviar el formulario con éxito, mostrar un mensaje claro: "Cuenta creada. Por favor, revisa tu correo electrónico para verificar tu cuenta."
    *   No redirigir automáticamente al panel, llevarlos al login o a una página de "Revisa tu bandeja de entrada".
*   **Nueva Página/Componente de Verificación:**
    *   Crear una ruta en el frontend (ej. `/verificar`) que lea el parámetro `token` de la URL.
    *   Al cargar, hacer la petición al backend para validar el token.
    *   Mostrar un mensaje de "Verificando..." y luego "Correo verificado con éxito, ya puedes iniciar sesión".

## 4. Requisitos Adicionales (Configuración)
*   Se necesitarán credenciales SMTP (usuario y contraseña de un correo, o API Key de un servicio de envíos) guardadas en el archivo `.env` del backend para poder enviar los correos reales.

---
**¿Qué te parece este plan?** Si estás de acuerdo, podemos empezar paso a paso, quizás comenzando por la base de datos y el backend.
