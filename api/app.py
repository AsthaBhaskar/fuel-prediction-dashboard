from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import random
import math
from geopy.distance import great_circle

app = FastAPI()

# Constants for fuel calculation
SFC = 0.2  # Specific Fuel Consumption (example value)
engine_efficiency = 0.85  # Example engine efficiency value

# Define a data model for incoming waypoint data
class Waypoint(BaseModel):
    latitude: float
    longitude: float
    tow_size: float
    engine_power: float
    towing_speed: float
    wind_speed: float
    wave_height: float

@app.post("/optimize_route/")
async def optimize_route(waypoints: list[Waypoint]):
    # Create a DataFrame from the input waypoints
    df = pd.DataFrame([wp.dict() for wp in waypoints])

    # Cost function to calculate fuel consumption
    def cost_function(route):
        total_cost = 0
        for i in range(len(route) - 1):
            coord1 = (route[i]['latitude'], route[i]['longitude'])
            coord2 = (route[i + 1]['latitude'], route[i + 1]['longitude'])
            distance = great_circle(coord1, coord2).nautical  # Distance in nautical miles

            # Extract features
            tow_size = route[i]['tow_size']
            engine_power = route[i]['engine_power']
            wind_speed = route[i]['wind_speed']
            wave_height = route[i]['wave_height']
            towing_speed = route[i]['towing_speed']

            # Calculate fuel consumption
            fuel_consumption = (
                engine_power * (
                    1 + tow_size / 1000 + wind_speed / 10 + wave_height / 10 + towing_speed / 10
                ) / (SFC * engine_efficiency)
            )
            total_cost += fuel_consumption

        return total_cost

    # Simulated Annealing algorithm
    def simulated_annealing(df, initial_temp, cooling_rate, stopping_temp):
        current_solution = df.sample(frac=1).to_dict(orient='records')  # Random initial solution
        current_cost = cost_function(current_solution)
        best_solution = current_solution
        best_cost = current_cost

        temperature = initial_temp

        while temperature > stopping_temp:
            new_solution = current_solution.copy()
            idx1, idx2 = random.sample(range(len(current_solution)), 2)
            new_solution[idx1], new_solution[idx2] = new_solution[idx2], new_solution[idx1]
            new_cost = cost_function(new_solution)

            # Acceptance probability
            if new_cost < current_cost or random.uniform(0, 1) < math.exp((current_cost - new_cost) / temperature):
                current_solution = new_solution
                current_cost = new_cost

            # Update best solution found
            if current_cost < best_cost:
                best_solution = current_solution
                best_cost = current_cost

            # Cool down
            temperature *= cooling_rate

        return best_solution, best_cost

    # Run Simulated Annealing
    initial_temp = 1000
    cooling_rate = 0.99
    stopping_temp = 1
    best_route, best_cost = simulated_annealing(df, initial_temp, cooling_rate, stopping_temp)

    return {"optimal_route": best_route, "optimal_cost": best_cost}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

