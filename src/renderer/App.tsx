import React from 'react';
import { ThemeProvider } from './ThemeContext';
import { MainScreen } from './components/MainScreen';
import { ToastProvider } from './components/Toast';

function App(): React.ReactElement {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainScreen />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
