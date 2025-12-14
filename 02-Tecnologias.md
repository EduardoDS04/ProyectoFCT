# Tecnologías Utilizadas
## Backend

**Node.js:** Entorno de ejecución JavaScript del lado del servidor, elegido por su alto rendimiento y ecosistema de paquetes npm.

**Express.js:** Framework minimalista para Node.js que facilita la creación de APIs RESTful y el manejo de rutas y middleware.

**TypeScript:** Superset de JavaScript con tipado estático que permite detectar errores en tiempo de compilación y mejorar la mantenibilidad del código.

**MongoDB:** Base de datos NoSQL orientada a documentos, ideal para arquitecturas de microservicios por su flexibilidad y escalabilidad horizontal.

**Mongoose:** ODM para MongoDB que proporciona modelado de esquemas, validación y métodos de consulta tipados.

**JWT (JSON Web Tokens):** Sistema de autenticación sin estado que permite validar usuarios entre microservicios sin consultas a base de datos.

**Docker:** Plataforma de contenedorización utilizada para ejecutar MongoDB de forma consistente y aislada.

**bcryptjs:** Biblioteca para hashear contraseñas de forma segura antes de almacenarlas en la base de datos.

**qrcode:** Librería para generar códigos QR únicos con información de autenticación para acceso al gimnasio.

**Helmet:** Middleware de Express que establece headers HTTP de seguridad para proteger la aplicación.

**CORS:** Configuración de Cross-Origin Resource Sharing para permitir peticiones desde el frontend.

## Frontend

**React 18:** Biblioteca de JavaScript para construir interfaces de usuario mediante componentes reutilizables y gestión eficiente del estado.

**TypeScript:** Mismo lenguaje que en backend para mantener consistencia en todo el stack y aprovechar el tipado estático.

**Vite:** Build tool moderno que proporciona desarrollo rápido con Hot Module Replacement y builds optimizados para producción.

**React Router DOM:** Librería para enrutamiento declarativo y protección de rutas según roles de usuario.

**Axios:** Cliente HTTP para comunicación con las APIs de los microservicios, con interceptores para tokens de autenticación.

**react-qr-code:** Componente React para renderizar códigos QR en el frontend de forma sencilla.

## Herramientas de Desarrollo

**Git:** Sistema de control de versiones para gestionar el código fuente y colaborar en el desarrollo.

**Docker Compose:** Herramienta para definir y ejecutar aplicaciones Docker multi-contenedor, utilizada para MongoDB.

**Nodemon:** Herramienta que reinicia automáticamente el servidor Node.js cuando se detectan cambios, mejorando la productividad.

**Draw.io:** Herramienta de diagramación gráfica online utilizada para crear el diagrama de casos de uso de forma visual e intuitiva.

**Mermaid:** Lenguaje de marcado basado en texto para crear diagramas (clases, flujos, casos de uso) que se integra fácilmente en documentación Markdown.

**CodeSnap:** Extensión de VS Code que permite capturar código como imágenes de alta calidad para incluir en la presentación del proyecto.

## Arquitectura

**Microservicios:** Arquitectura que separa el sistema en servicios independientes, cada uno con su propia base de datos, permitiendo escalabilidad y mantenibilidad.

**REST API:** Estilo arquitectónico para comunicación entre servicios mediante peticiones HTTP estándar (GET, POST, PUT, DELETE).

