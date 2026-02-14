import React from 'react';
import { ThemeProvider } from './ThemeContext';
import { MainScreen } from './components/MainScreen';

function App(): React.ReactElement {
  return (
    <ThemeProvider>
      <MainScreen />
    </ThemeProvider>
  );
}

export default App;
