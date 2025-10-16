import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress findDOMNode warnings from react-quill
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

const shouldSuppressMessage = (message) => {
  if (typeof message === 'string') {
    return message.includes('findDOMNode is deprecated') || 
           (message.includes('findDOMNode') && message.includes('deprecated')) ||
           message.includes('findDOMNode') && message.includes('will be removed');
  }
  return false;
};

// Override console methods to filter out findDOMNode warnings
console.warn = (...args) => {
  if (shouldSuppressMessage(args[0])) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

console.error = (...args) => {
  if (shouldSuppressMessage(args[0])) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Also override the global error handler to catch React warnings
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('findDOMNode')) {
    event.preventDefault();
    return false;
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
