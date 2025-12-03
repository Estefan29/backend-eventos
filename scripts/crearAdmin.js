require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

const crearUsuariosDefecto = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventos-usc');
    console.log('✅ Conectado a MongoDB');

    // ===========================
    // 1. CREAR ADMINISTRADOR
    // ===========================
    const adminExistente = await Usuario.findOne({ rol: 'admin' });
    
    if (!adminExistente) {
      const passwordAdmin = 'admin123';
      const saltAdmin = await bcrypt.genSalt(10);
      const hashAdmin = await bcrypt.hash(passwordAdmin, saltAdmin);

      const admin = new Usuario({
        nombre: 'Administrador USC',
        correo: 'admin@usc.edu.co',
        password: hashAdmin,
        rol: 'admin',
        telefono: '3001234567',
        carrera: 'Administración del Sistema'
      });

      await admin.save();
      console.log('✅ Administrador creado');
      console.log('📧 Email: admin@usc.edu.co');
      console.log('🔑 Password: admin123\n');
    } else {
      console.log('⚠️  Administrador ya existe\n');
    }

    // ===========================
    // 2. CREAR ADMINISTRATIVO
    // ===========================
    const administrativoExistente = await Usuario.findOne({ rol: 'administrativo' });
    
    if (!administrativoExistente) {
      const passwordAdministrativo = 'admin123';
      const saltAdministrativo = await bcrypt.genSalt(10);
      const hashAdministrativo = await bcrypt.hash(passwordAdministrativo, saltAdministrativo);

      const administrativo = new Usuario({
        nombre: 'Secretaría USC',
        correo: 'secretaria@usc.edu.co',
        password: hashAdministrativo,
        rol: 'administrativo',
        telefono: '3009876543',
        carrera: 'Secretaría Académica'
      });

      await administrativo.save();
      console.log('✅ Usuario Administrativo creado');
      console.log('📧 Email: secretaria@usc.edu.co');
      console.log('🔑 Password: admin123\n');
    } else {
      console.log('⚠️  Usuario Administrativo ya existe\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Proceso completado');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

crearUsuariosDefecto();