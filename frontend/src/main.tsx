import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { TeamProvider } from './context/TeamContext';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <TeamProvider>
            <App />
          </TeamProvider>
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
