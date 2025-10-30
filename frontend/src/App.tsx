import React from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-primary-600 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">GAIA: Geospatial AI-driven Assessment</h1>
        <p className="text-sm">Philippine Environmental Hazard Detection System</p>
      </header>
      <main className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to GAIA</h2>
          <p className="text-gray-700">
            Real-time hazard detection and mapping for Philippine disaster response.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
