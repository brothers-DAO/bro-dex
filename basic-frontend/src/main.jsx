import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import App from './App.jsx'
import { PrimeReactProvider } from "primereact/api";
import 'primeflex/primeflex.css';
import "primereact/resources/themes/nano/theme.css";
import 'primeicons/primeicons.css';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrimeReactProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PrimeReactProvider>
  </React.StrictMode>
)
