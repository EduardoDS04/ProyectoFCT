// MongoDB automáticamente crea el usuario root usando las variables de entorno:
// - MONGO_INITDB_ROOT_USERNAME
// - MONGO_INITDB_ROOT_PASSWORD
db = db.getSiblingDB('admin');
// Crear base de datos para Auth Service
var authDbName = 'gimnasio_auth';
db = db.getSiblingDB(authDbName);
db.createCollection('users');
print('Base de datos ' + authDbName + ' creada');

// Crear base de datos para Class Service
var classDbName = 'gimnasio_classes';
db = db.getSiblingDB(classDbName);
db.createCollection('classes');
db.createCollection('bookings');
print('Base de datos ' + classDbName + ' creada');

print('Inicialización de MongoDB completada');

