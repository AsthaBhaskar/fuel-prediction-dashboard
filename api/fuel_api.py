from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from tensorflow.keras.models import load_model
import joblib
import os
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class ModelManager:
    def __init__(self):
        self.model = None
        self.model_type = None
        self.model_status = "uninitialized"
        self.load_model()
    
    def load_model(self):
        """Attempt to load the ML model with detailed error handling."""
        try:
            if os.path.exists('fuel_model.pkl'):
                logger.info("Loading sklearn model from fuel_model.pkl")
                self.model = joblib.load('fuel_model.pkl')
                self.model_type = 'sklearn'
                self.model_status = "loaded"
            elif os.path.exists('fuel_model.h5'):
                logger.info("Loading Keras model from fuel_model.h5")
                self.model = load_model('fuel_model.h5')
                self.model_type = 'keras'
                self.model_status = "loaded"
            else:
                logger.warning("No model file found - running in mock mode")
                self.model_type = 'mock'
                self.model_status = "mock"
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            self.model_status = f"error: {str(e)}"
            self.model_type = 'mock'

    def predict(self, input_data):
        """Make a prediction using the loaded model or mock data."""
        try:
            if self.model_type == 'mock':
                # Generate deterministic mock predictions based on input
                seed = sum(map(float, input_data.flatten()))
                np.random.seed(int(seed * 1000))
                prediction = float(np.random.uniform(500, 2000))
                logger.info("Generated mock prediction")
                return prediction
            
            if self.model_type == 'sklearn':
                prediction = float(self.model.predict(input_data)[0])
            else:  # keras
                prediction = float(self.model.predict(input_data)[0][0])
                
            logger.info(f"Generated prediction using {self.model_type} model")
            return prediction
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            raise

model_manager = ModelManager()

def preprocess_input(data):
    """Preprocess and validate the input data."""
    try:
        # Validate all required fields are present and have correct types
        required_fields = {
            'engineType': (int, float),
            'enginePower': (int, float),
            'distance': (int, float),
            'towingSpeed': (int, float),
            'towSize': (int, float),
            'windSpeed': (int, float),
            'currentSpeed': (int, float),
            'waveHeight': (int, float),
            'windDirection': (int, float),
            'maintenanceHistory': (int, float)
        }

        for field, types in required_fields.items():
            if field not in data:
                raise ValueError(f"Missing required field: {field}")
            
            value = data[field]
            if not isinstance(value, types):
                raise ValueError(f"Invalid type for {field}: expected {types}, got {type(value)}")

        # Convert to numpy array for model input
        return np.array([[
            float(data['engineType']),
            float(data['enginePower']),
            float(data['distance']),
            float(data['towingSpeed']),
            float(data['towSize']),
            float(data['windSpeed']),
            float(data['currentSpeed']),
            float(data['waveHeight']),
            float(data['windDirection']),
            float(data['maintenanceHistory'])
        ]])
    except Exception as e:
        logger.error(f"Preprocessing error: {str(e)}")
        raise ValueError(f"Input preprocessing failed: {str(e)}")

@app.route('/api/predict', methods=['POST'])
def predict():
    """Handle prediction requests with comprehensive error handling."""
    try:
        # Validate request
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No data provided',
                'modelStatus': model_manager.model_status
            }), 400

        # Preprocess input
        try:
            input_data = preprocess_input(data)
        except ValueError as e:
            return jsonify({
                'error': str(e),
                'modelStatus': model_manager.model_status
            }), 400

        # Generate prediction
        prediction = model_manager.predict(input_data)

        return jsonify({
            'prediction': prediction,
            'modelType': model_manager.model_type,
            'modelStatus': model_manager.model_status
        })

    except Exception as e:
        logger.error(f"Prediction endpoint error: {str(e)}")
        return jsonify({
            'error': str(e),
            'modelType': model_manager.model_type,
            'modelStatus': model_manager.model_status
        }), 500

@app.route('/api/status', methods=['GET'])
def status():
    """Endpoint to check model status."""
    return jsonify({
        'modelType': model_manager.model_type,
        'modelStatus': model_manager.model_status
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)