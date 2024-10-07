const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Generate sample dataset
function generateSampleData(count = 100) {
  const dataset = [];
  for (let i = 0; i < count; i++) {
    dataset.push({
      id: i + 1,
      engineType: ['Diesel', 'Electric', 'Hybrid'][Math.floor(Math.random() * 3)],
      enginePower: Math.floor(Math.random() * 2000) + 500, // 500-2500 kW
      fuelConsumption: Math.floor(Math.random() * 500) + 100, // 100-600 L
      distance: Math.floor(Math.random() * 100) + 10, // 10-110 nautical miles
      towingSpeed: Math.floor(Math.random() * 10) + 5, // 5-15 m/s
      towSize: Math.floor(Math.random() * 5000) + 1000, // 1000-6000 tonnes
      windSpeed: Math.floor(Math.random() * 15) + 1, // 1-16 m/s
      waveHeight: Math.floor(Math.random() * 5) + 1, // 1-6 m
      efficiency: Math.random() * 20 + 80, // 80-100%
      maintenanceStatus: ['Good', 'Fair', 'Needs Service'][Math.floor(Math.random() * 3)]
    });
  }
  return dataset;
}

const dataset = generateSampleData();

// Simple linear regression for prediction
function predictFuelConsumption(input) {
  // Simple weighted calculation based on input parameters
  const baseConsumption = 100; // Base fuel consumption in liters
  const weights = {
    enginePower: 0.05,
    distance: 0.8,
    towingSpeed: 0.4,
    towSize: 0.003,
    windSpeed: 0.2,
    waveHeight: 0.3
  };

  return baseConsumption + 
    (input.enginePower * weights.enginePower) +
    (input.distance * weights.distance) +
    (input.towingSpeed * weights.towingSpeed) +
    (input.towSize * weights.towSize) +
    (input.windSpeed * weights.windSpeed) +
    (input.waveHeight * weights.waveHeight);
}

app.get('/api/data', (req, res) => {
  res.json(dataset); // Send all sample data
});

app.post('/api/predict', (req, res) => {
  const prediction = predictFuelConsumption(req.body);
  res.json({ prediction });
});

// Simulated Annealing for route optimization
function simulatedAnnealing(points, initialTemperature = 1000, coolingRate = 0.003) {
  let currentSolution = [...points];
  let bestSolution = [...currentSolution];
  let temperature = initialTemperature;

  function calculateTotalDistance(route) {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += distance(route[i], route[i + 1]);
    }
    return totalDistance;
  }

  function distance(point1, point2) {
    return Math.sqrt(
      Math.pow(point1.latitude - point2.latitude, 2) + 
      Math.pow(point1.longitude - point2.longitude, 2)
    );
  }

  while (temperature > 1) {
    let newSolution = [...currentSolution];
    let pos1 = Math.floor(Math.random() * newSolution.length);
    let pos2 = Math.floor(Math.random() * newSolution.length);
    [newSolution[pos1], newSolution[pos2]] = [newSolution[pos2], newSolution[pos1]];

    let currentEnergy = calculateTotalDistance(currentSolution);
    let newEnergy = calculateTotalDistance(newSolution);

    if (Math.random() < Math.exp((currentEnergy - newEnergy) / temperature)) {
      currentSolution = [...newSolution];
    }

    if (calculateTotalDistance(currentSolution) < calculateTotalDistance(bestSolution)) {
      bestSolution = [...currentSolution];
    }

    temperature *= 1 - coolingRate;
  }

  return bestSolution;
}

app.post('/api/optimize-route', (req, res) => {
  const optimizedRoute = simulatedAnnealing(req.body.points);
  
  // Calculate total fuel consumption for the optimized route
  let totalFuelConsumption = 0;
  for (let i = 0; i < optimizedRoute.length - 1; i++) {
    const distance = Math.sqrt(
      Math.pow(optimizedRoute[i].latitude - optimizedRoute[i+1].latitude, 2) +
      Math.pow(optimizedRoute[i].longitude - optimizedRoute[i+1].longitude, 2)
    );
    
    const prediction = predictFuelConsumption({
      enginePower: req.body.enginePower,
      distance: distance,
      towingSpeed: req.body.towingSpeed,
      towSize: req.body.towSize,
      windSpeed: req.body.windSpeed,
      waveHeight: req.body.waveHeight
    });
    
    totalFuelConsumption += prediction;
  }

  res.json({ 
    optimizedRoute, 
    fuelConsumption: totalFuelConsumption 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Generated ${dataset.length} sample records`);
});