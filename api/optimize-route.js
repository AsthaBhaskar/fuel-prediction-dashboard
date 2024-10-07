const express = require('express');
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const tf = require('@tensorflow/tfjs'); // Import TensorFlow.js
require('@tensorflow/tfjs-node'); // Use TensorFlow.js with Node.js
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

let dataset = [];
let model;

// Load dataset
fs.createReadStream('tugd.csv')
  .pipe(csv())
  .on('data', (data) => dataset.push(data))
  .on('end', () => {
    console.log('Dataset loaded');
    trainModel();
  });

async function trainModel() {
  // Prepare data for training
  const X = dataset.map(row => [
    parseFloat(row['Engine Power of Tugboat(kW)']),
    parseFloat(row['Distance(nautical miles)']),
    parseFloat(row['Towing Speed of Tugboats(meters per second)']),
    parseFloat(row['Tow Size/weight of the vehicle being towed(tonnes)']),
    parseFloat(row['Wind Speed(meters per second)']),
    parseFloat(row['Wave Height(meters per second)'])
  ]);
  const y = dataset.map(row => parseFloat(row['Fuel Consumption(Litres)']));

  // Convert data to tensors
  const xs = tf.tensor2d(X);
  const ys = tf.tensor2d(y, [y.length, 1]);

  // Create a sequential model
  model = tf.sequential();
  model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [X[0].length] }));
  model.add(tf.layers.dense({ units: 1 })); // Output layer

  // Compile the model
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

  // Train the model
  await model.fit(xs, ys, { epochs: 100 });
  console.log('Model trained');
}

app.get('/api/data', (req, res) => {
  res.json(dataset.slice(0, 100)); // Send first 100 rows
});

app.post('/api/predict', async (req, res) => {
  const input = [
    req.body.enginePower,
    req.body.distance,
    req.body.towingSpeed,
    req.body.towSize,
    req.body.windSpeed,
    req.body.waveHeight
  ];
  
  // Predict using the trained model
  const prediction = model.predict(tf.tensor2d([input], [1, input.length]));
  const predictedValue = await prediction.data(); // Get the predicted value
  res.json({ prediction: predictedValue[0] });
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
    return Math.sqrt(Math.pow(point1.latitude - point2.latitude, 2) + Math.pow(point1.longitude - point2.longitude, 2));
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

app.post('/api/optimize-route', async (req, res) => {
  const optimizedRoute = simulatedAnnealing(req.body.points);
  
  // Predict fuel consumption for the optimized route
  let totalFuelConsumption = 0;
  for (let i = 0; i < optimizedRoute.length - 1; i++) {
    const distance = Math.sqrt(
      Math.pow(optimizedRoute[i].latitude - optimizedRoute[i+1].latitude, 2) +
      Math.pow(optimizedRoute[i].longitude - optimizedRoute[i+1].longitude, 2)
    );
    const prediction = model.predict(tf.tensor2d([[
      req.body.enginePower,
      distance,
      req.body.towingSpeed,
      req.body.towSize,
      req.body.windSpeed,
      req.body.waveHeight
    ]]));
    const predictedValue = await prediction.data(); // Get the predicted value
    totalFuelConsumption += predictedValue[0];
  }

  res.json({ 
    optimizedRoute, 
    fuelConsumption: totalFuelConsumption 
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
