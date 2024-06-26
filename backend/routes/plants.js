const express = require('express');
const router = express.Router();

const {
    getAllPlants,
    getPlantById,
    addPlant,
    updatePlantById,
    deletePlantById,
    getAllPresetPlants
} = require('../controllers/plantController');

// GET Requests
router.get('/list/:uuid', getAllPlants);
router.get('/presets', getAllPresetPlants);
router.get('/:id', getPlantById);

// POST Requests
router.post('/', addPlant)

// PATCH Requests
router.patch('/:id', updatePlantById);

// DELETE Requests
router.delete('/:id', deletePlantById);


module.exports = router;
