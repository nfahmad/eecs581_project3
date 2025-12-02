/*
Program: EECS 581 Project 3 - Live Chat Web Application
File: main.tsx
Description:
    Entry point for the React application. This file bootstraps the frontend by:
    - Importing global styles
    - Initializing the root React component
    - Rendering the <App> component into the HTML root element

Author: EECS 581 Project 3 Team
Date: November 23 2025
*/

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css'; // Global styles and theme variables
import App from './App.tsx'; // Root component of the UI

// Locate the root DOM element where React will mount UI
const rootElement = document.getElementById('root')!;

// Initialize and render the main application within the React DOM tree
createRoot(rootElement).render(
  // StrictMode helps highlight potential problems in development
  <StrictMode>
    <App />
  </StrictMode>
);
