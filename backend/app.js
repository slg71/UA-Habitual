const express = require('express');
require('dotenv').config();
require('./config/db');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(authRoutes);
app.use(profileRoutes);

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});