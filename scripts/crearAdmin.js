require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario'); // Ajusta la ruta según tu estructura

const crearAdminPorDefecto = async () => {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventos-usc');
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un administrador
    const adminExistente = await Usuario.findOne({ rol: 'admin' });
    
    if (adminExistente) {
      console.log('⚠️  Ya existe un administrador en el sistema');
      console.log('📧 Email:', adminExistente.correo);
      
      // Preguntar si desea cambiar la contraseña
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('¿Deseas cambiar la contraseña del admin? (s/n): ', async (respuesta) => {
        if (respuesta.toLowerCase() === 's') {
          readline.question('Ingresa la nueva contraseña (mínimo 6 caracteres): ', async (nuevaContraseña) => {
            if (nuevaContraseña.length < 6) {
              console.log('❌ La contraseña debe tener al menos 6 caracteres');
            } else {
              const salt = await bcrypt.genSalt(10);
              adminExistente.contraseña = await bcrypt.hash(nuevaContraseña, salt);
              await adminExistente.save();
              console.log('✅ Contraseña del administrador actualizada');
            }
            readline.close();
            process.exit(0);
          });
        } else {
          readline.close();
          process.exit(0);
        }
      });
      
      return;
    }

    // Crear nuevo administrador
    console.log('\n🔐 Creando administrador por defecto...\n');

    const datosAdmin = {
      nombre: 'Administrador USC',
      correo: 'admin@usc.edu.co', // Cambiar según tu dominio
      contraseña: 'admin123', // ⚠️ CAMBIAR DESPUÉS DEL PRIMER LOGIN
      rol: 'admin',
      telefono: '3001234567',
      carrera: 'Administración del Sistema'
    };

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    datosAdmin.contraseña = await bcrypt.hash(datosAdmin.contraseña, salt);

    // Crear usuario admin
    const admin = new Usuario(datosAdmin);
    await admin.save();

    console.log('✅ Administrador creado exitosamente!');
    console.log('\n📋 Credenciales del administrador:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:     ${datosAdmin.correo}`);
    console.log(`🔑 Contraseña: admin123`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error al crear administrador:', error);
    process.exit(1);
  }
};

// Ejecutar función
crearAdminPorDefecto();
