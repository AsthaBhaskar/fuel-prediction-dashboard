'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import { Home, Droplet, Map, BarChart2, Wind, Anchor, Fuel, Wifi, WifiOff } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';

// Custom Alert Component
const CustomAlert = ({ children, type = 'info' }) => (
  <div className={`${
    type === 'info' ? 'bg-blue-100 border-blue-500 text-blue-700' : 
    type === 'warning' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
    'bg-green-100 border-green-500 text-green-700'
  } border-l-4 p-4 mt-4`} role="alert">
    {children}
  </div>
);


// Sidebar Component
const Sidebar = ({ activePage, setActivePage }) => (
  <div className="bg-gray-800 w-64 h-screen fixed left-0 top-0 p-4">
    <h1 className="text-2xl font-bold mb-8 text-white">Dashboard</h1>
    <nav>
      <ul>
        <li className="mb-4">
          <button
            className={`flex items-center text-white ${activePage === 'dataset' ? 'bg-blue-600' : 'hover:bg-gray-700'} w-full p-2 rounded`}
            onClick={() => setActivePage('dataset')}
          >
            <Home className="mr-2" /> Dataset Overview
          </button>
        </li>
        <li className="mb-4">
          <button
            className={`flex items-center text-white ${activePage === 'fuel' ? 'bg-blue-600' : 'hover:bg-gray-700'} w-full p-2 rounded`}
            onClick={() => setActivePage('fuel')}
          >
            <Droplet className="mr-2" /> Fuel Management
          </button>
        </li>
        <li className="mb-4">
          <button
            className={`flex items-center text-white ${activePage === 'route' ? 'bg-blue-600' : 'hover:bg-gray-700'} w-full p-2 rounded`}
            onClick={() => setActivePage('route')}
          >
            <Map className="mr-2" /> Route Optimization
          </button>
        </li>
      </ul>
    </nav>
  </div>
);

// Utility functions for statistical calculations
const calculateStats = (data, field) => {
  const values = data.map(d => d[field]).sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const n = values.length;
  const mean = sum / n;
  const median = n % 2 === 0 
    ? (values[n/2 - 1] + values[n/2]) / 2 
    : values[Math.floor(n/2)];
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const min = values[0];
  const max = values[values.length - 1];

  return {
    mean: mean.toFixed(2),
    median: median.toFixed(2),
    stdDev: stdDev.toFixed(2),
    min: min.toFixed(2),
    max: max.toFixed(2),
    count: n
  };
};

// Updated Fuel Management Component
// Updated Fuel Management Component
const FuelManagement = ({ data = [] }) => {
  const [parameters, setParameters] = useState({
    enginePower: 1000,
    distance: 100,
    towingSpeed: 8,
    towSize: 3000,
    windSpeed: 5,
    waveHeight: 1
  });
  
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getPrediction = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parameters)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPrediction(data.prediction);
    } catch (err) {
      setError(`Failed to get prediction: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setParameters(prev => ({ ...prev, [name]: Number(value) }));
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">ML-Enhanced Fuel Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Droplet className="w-6 h-6" />
              <h3 className="text-xl font-semibold">ML Fuel Consumption Predictor</h3>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {Object.keys(parameters).map(param => (
                <div key={param}>
                  <label className="block mb-2">{param.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                  <input
                    type="number"
                    name={param}
                    value={parameters[param]}
                    onChange={handleInputChange}
                    min={0}
                    className="w-full p-2 bg-gray-800 rounded border border-gray-700"
                  />
                </div>
              ))}
            </div>

            <Button onClick={getPrediction} disabled={isLoading}>
              {isLoading ? 'Predicting...' : 'Predict Fuel Consumption'}
            </Button>

            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <CustomAlert type="warning">{error}</CustomAlert>
            ) : prediction !== null && (
              <CustomAlert type="info">
                ML Predicted Fuel Consumption: {prediction.toFixed(2)} units
              </CustomAlert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Route Optimization Component with ML Integration
const RouteOptimization = ({ data }) => {
  const [routeParams, setRouteParams] = useState({
    startLatitude: 0,
    startLongitude: 0,
    endLatitude: 0,
    endLongitude: 0,
    enginePower: 1000,
    towingSpeed: 8,
    towSize: 3000,
    windSpeed: 5,
    waveHeight: 1
  });
  
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routeStats, setRouteStats] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRouteParams(prev => ({ ...prev, [name]: Number(value) }));
  };

  const getOptimizedRoute = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call with random data (replace with actual API call)
      const simulatedResponse = {
        route: Array.from({ length: 10 }, (_, i) => ({
          latitude: routeParams.startLatitude + (routeParams.endLatitude - routeParams.startLatitude) * (i / 9),
          longitude: routeParams.startLongitude + (routeParams.endLongitude - routeParams.startLongitude) * (i / 9),
          distance: i * 10,
          estimatedFuel: Math.random() * 100 + 50
        })),
        stats: {
          totalDistance: Math.random() * 500 + 200,
          estimatedFuelConsumption: Math.random() * 1000 + 500,
          estimatedDuration: Math.random() * 24 + 12
        }
      };

      setOptimizedRoute(simulatedResponse.route);
      setRouteStats(simulatedResponse.stats);
    } catch (err) {
      setError('Failed to optimize route. Please try again.');
      console.error('Route optimization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">ML Route Optimization</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Map className="w-6 h-6" />
              <h3 className="text-xl font-semibold">Route Parameters</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Start Latitude</label>
                <input
                  type="number"
                  name="startLatitude"
                  value={routeParams.startLatitude}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 rounded border border-gray-700"
                />
              </div>
              <div>
                <label className="block mb-2">Start Longitude</label>
                <input
                  type="number"
                  name="startLongitude"
                  value={routeParams.startLongitude}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 rounded border border-gray-700"
                />
              </div>
              <div>
                <label className="block mb-2">End Latitude</label>
                <input
                  type="number"
                  name="endLatitude"
                  value={routeParams.endLatitude}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 rounded border border-gray-700"
                />
              </div>
              <div>
                <label className="block mb-2">End Longitude</label>
                <input
                  type="number"
                  name="endLongitude"
                  value={routeParams.endLongitude}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 rounded border border-gray-700"
                />
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(routeParams)
                .filter(([key]) => !['startLatitude', 'startLongitude', 'endLatitude', 'endLongitude'].includes(key))
                .map(([param, value]) => (
                  <div key={param}>
                    <label className="block mb-2">{param.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                    <input
                      type="number"
                      name={param}
                      value={value}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-800 rounded border border-gray-700"
                    />
                  </div>
              ))}
            </div>

            <Button onClick={getOptimizedRoute} disabled={isLoading} className="w-full">
              {isLoading ? 'Optimizing Route...' : 'Optimize Route'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Anchor className="w-6 h-6" />
              <h3 className="text-xl font-semibold">Optimized Route</h3>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <CustomAlert type="warning">{error}</CustomAlert>
            ) : optimizedRoute && (
              <div className="space-y-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={optimizedRoute}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="distance" label={{ value: 'Distance (nm)', position: 'bottom' }} />
                      <YAxis dataKey="estimatedFuel" label={{ value: 'Estimated Fuel (L)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="estimatedFuel" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {routeStats && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Route Statistics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-800 p-4 rounded">
                        <p className="text-sm text-gray-400">Total Distance</p>
                        <p className="text-xl font-bold">{routeStats.totalDistance.toFixed(1)} nm</p>
                      </div>
                      <div className="bg-gray-800 p-4 rounded">
                        <p className="text-sm text-gray-400">Est. Fuel</p>
                        <p className="text-xl font-bold">{routeStats.estimatedFuelConsumption.toFixed(1)} L</p>
                      </div>
                      <div className="bg-gray-800 p-4 rounded">
                        <p className="text-sm text-gray-400">Est. Duration</p>
                        <p className="text-xl font-bold">{routeStats.estimatedDuration.toFixed(1)} hrs</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};




// Define the data prop types for TypeScript
type DatasetOverviewProps = {
  data: Array<{ [key: string]: any }>; // Array of objects with any key-value pairs
};

// Dataset Overview Component
const DatasetOverview: React.FC<DatasetOverviewProps> = ({ data }) => {
  // Ensure data exists before accessing
  if (!data || data.length === 0) return <p>No data available.</p>;

  // Extract first 10 rows
  const first10Rows = data.slice(0, 10);

  // Identify numerical fields in the dataset
  const numericalFields = Object.keys(data[0]).filter((key) => typeof data[0][key] === 'number');

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Dataset Overview</h2>

      {/* Display first 10 rows */}
      <Card>
        <CardHeader>First 10 Rows</CardHeader>
        <CardContent>
          <div className="overflow-x-auto"> {/* Make table horizontally scrollable */}
            <table className="table-auto w-full text-left">
              <thead>
                <tr>
                  {Object.keys(first10Rows[0]).map((key) => (
                    <th key={key} className="px-4 py-2 whitespace-nowrap">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {first10Rows.map((row, index) => (
                  <tr key={index}>
                    {Object.keys(row).map((key) => (
                      <td key={key} className="border px-4 py-2 whitespace-nowrap">{row[key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Display visualizations for numerical fields */}
      <Card>
        <CardHeader>Data Visualization (Numerical Features)</CardHeader>
        <CardContent>
          {numericalFields.map((field) => (
            <div key={field} className="mb-8">
              <h3 className="text-xl font-semibold mb-4">{field}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="engineType" /> {/* Change this to a relevant categorical field */}
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey={field} fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};


// File Upload Component
const FileUpload = ({ onDataLoaded }) => {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          onDataLoaded(results.data);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
        }
      });
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
    </div>
  );
};

// Main Dashboard Component
// Main Dashboard Component
const Dashboard = () => {
  const [activePage, setActivePage] = useState('dataset');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load initial data from the API
    const loadInitialData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/data');
        if (!response.ok) {
          throw new Error('Failed to fetch initial data');
        }
        const initialData = await response.json();
        setData(initialData);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load initial data. Please try uploading a CSV file.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);
  // Add this function to handle data loaded from CSV
  const handleDataLoaded = (newData) => {
    setData(newData);
    setError(null);
    setIsLoading(false);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Main layout
  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      
      {/* Main content */}
      <div className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">
              {activePage === 'dataset' ? 'Dataset Overview' :
               activePage === 'fuel' ? 'Fuel Management' :
               'Route Optimization'}
            </h1>
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
        </div>

        {/* Conditional rendering of main content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : data.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">No Data Available</h3>
              <p className="text-gray-400 mb-4">
                Please upload a CSV file to get started with the analysis.
              </p>
              <p className="text-sm text-gray-500">
                The CSV should contain columns for engineType, fuelConsumption, and other relevant vessel metrics.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {activePage === 'dataset' && <DatasetOverview data={data} />}
            {activePage === 'fuel' && <FuelManagement data={data} />}
            {activePage === 'route' && <RouteOptimization data={data} />}
          </>
        )}
      </div>
    </div>
  );
};
export default Dashboard;
