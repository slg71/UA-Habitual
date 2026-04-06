const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
require('./config/db');

const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const communitiesRoutes = require('./routes/communitiesRoutes');
const postsRoutes = require('./routes/postsRoutes');
const commentsRoutes = require('./routes/commentsRoutes');
const goalsRoutes = require('./routes/goalsRoutes');
const followsRoutes = require('./routes/followsRoutes');
const likesRoutes = require('./routes/likesRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sin prefijo /api
app.use(authRoutes);
app.use(usersRoutes);
app.use(communitiesRoutes);
app.use(postsRoutes);
app.use(commentsRoutes);
app.use(goalsRoutes);
app.use(followsRoutes);
app.use(likesRoutes);

// Con prefijo /api
app.use('/api', authRoutes);
app.use('/api', usersRoutes);
app.use('/api', communitiesRoutes);
app.use('/api', postsRoutes);
app.use('/api', commentsRoutes);
app.use('/api', goalsRoutes);
app.use('/api', followsRoutes);
app.use('/api', likesRoutes);

const frontendDistPath = path.resolve(__dirname, '..', 'frontend', 'dist');

if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});