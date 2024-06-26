const express = require('express');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const cron = require('node-cron');

require('dotenv').config();

const plantRoutes = require('./routes/plants');
const accountRoutes = require('./routes/accounts');
const recipeRoutes = require('./routes/recipe');
const { schedulePlantWateringJobs, sendRecipeOfTheDay } = require('./utilities/cronScheduler');

const PORT = process.env.PORT || 4000;
const WS_PORT = process.env.WS_PORT || 8080; // WebSocket port

// Express app
const app = express();

// middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
// Enable CORS
app.use(cors({
    origin: 'http://localhost:3000', // Allow this origin
    credentials: true, // Allow credentials
}));
app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

// routes
app.use('/api/plants', plantRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/recipe', recipeRoutes)

// Connect to the database
mongoose.connect(process.env.ATLAS_URI)
    .then(() => {
        // Start HTTP server
        const server = app.listen(PORT, () => {
            console.log(`Successfully connected to MongoDB.`);
            console.log(`HTTP server listening on port ${PORT}.`);
        });

        // WebSocket server setup
        const wss = new WebSocket.Server({ server });
        wss.on('connection', (ws) => {
            console.log('Client connected to WebSocket.');
            ws.on('message', (message) => {
                console.log(`Received: ${message}`);
            });
            ws.on('close', () => console.log('Client disconnected'));
        });
        
        // Refresh and schedule cron jobs for plant watering at 8:55AM
        //      note. all plant notifications will be scheduled for 9:00AM
        cron.schedule('55 8 * * *', () => {
            console.log("Refreshing plant watering schedules...");
            schedulePlantWateringJobs(wss)
                .then(() => console.log("Plant watering schedules refreshed."))
                .catch(console.error);
        });

        // send recipe of the day at 9:05AM
        cron.schedule('05 9 * * *', () => {
            console.log("Sending Recipe Of The Day...");
            sendRecipeOfTheDay()
                .then(() => console.log("Recipe OTD Complete."))
                .catch(console.error);
        });

        // initial scheduling of cron jobs for plant watering
        schedulePlantWateringJobs(wss).catch(console.error);

    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });
