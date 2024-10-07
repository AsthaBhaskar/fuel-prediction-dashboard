import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Existing function for class merging
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// New function: Calculate great circle distance
export const greatCircleDistance = (point1: { Latitude: number, Longitude: number }, point2: { Latitude: number, Longitude: number }) => {
  const R = 6371; // Radius of the earth in kilometers
  const degToRad = (deg: number) => deg * (Math.PI / 180);

  const lat1 = point1.Latitude;
  const lon1 = point1.Longitude;
  const lat2 = point2.Latitude;
  const lon2 = point2.Longitude;

  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in kilometers
  return distance;
};

// New function: Simulated Annealing algorithm
export const simulatedAnnealing = (data: any[], initialTemp: number, coolingRate: number, stoppingTemp: number, costFunction: (route: any[]) => number) => {
  let currentSolution = [...data]; // Clone data as initial solution
  let currentCost = costFunction(currentSolution);
  let bestSolution = [...currentSolution];
  let bestCost = currentCost;
  let temperature = initialTemp;

  while (temperature > stoppingTemp) {
    // Generate new solution by swapping two random points
    const newSolution = [...currentSolution];
    const idx1 = Math.floor(Math.random() * newSolution.length);
    const idx2 = Math.floor(Math.random() * newSolution.length);
    [newSolution[idx1], newSolution[idx2]] = [newSolution[idx2], newSolution[idx1]];

    const newCost = costFunction(newSolution);

    // Accept new solution if it's better or based on probability
    if (newCost < currentCost || Math.random() < Math.exp((currentCost - newCost) / temperature)) {
      currentSolution = [...newSolution];
      currentCost = newCost;
    }

    // Track best solution
    if (currentCost < bestCost) {
      bestSolution = [...currentSolution];
      bestCost = currentCost;
    }

    // Decrease temperature
    temperature *= coolingRate;
  }

  return { bestSolution, bestCost };
};
