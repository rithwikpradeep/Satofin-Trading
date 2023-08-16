// Importing necessary modules from their respective packages.
import React from 'react'; // The core React library.
import ReactDOM from 'react-dom/client'; // React's DOM rendering functions.
import './index.css'; // Importing global styles for the app.
import App from './App'; // Main App component.
import reportWebVitals from './reportWebVitals'; // Utility for measuring web app performance.
import { Scrypt, bsv } from 'scrypt-ts'; // Importing Scrypt and bsv from the 'scrypt-ts' library.

import { TradingPlatformApp } from './contracts/trading'; // Importing the TradingPlatformApp contract.
import artifact from '../artifacts/trading.json'; // Importing the artifact for the TradingPlatformApp contract.

// Loading the artifact for the TradingPlatformApp. This artifact contains metadata about the contract.
// If this is not loaded, the app won't recognize the contract's structure and methods.
TradingPlatformApp.loadArtifact(artifact);

// Initializing Scrypt with necessary configurations.
Scrypt.init({
  // The API key is required to interact with the Scrypt service.
  // If this key is changed or removed, the app might not be able to communicate with the Scrypt service.
  apiKey: process.env.REACT_APP_API_KEY || '',
  // Setting the network to 'testnet'. Changing this might affect how the app interacts with the blockchain.
  network: bsv.Networks.testnet
})

// Creating a root for React's concurrent mode. This allows React to interrupt rendering to work on multiple tasks at once.
// Changing this might affect the app's rendering performance.
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
// Rendering the main App component inside the root.
// If the App component or its children are modified, it will affect the entire app's UI and functionality.
root.render(
  <App />
);

// This function measures the performance of the app.
// If you want to monitor the app's performance, you can pass a logging function or send the results to an analytics endpoint.
// Removing or altering this might affect the app's performance monitoring capabilities.
reportWebVitals();
