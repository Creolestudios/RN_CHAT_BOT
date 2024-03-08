import React, {useEffect} from 'react';
import AppNavigation from './src/navigation';
import {apiCall} from './src/api/openAi';

const App = () => {
  useEffect(() => {
    // apiCall('what is quantum computing');
  }, []);
  return (
    <>
      <AppNavigation />
    </>
  );
};

export default App;
