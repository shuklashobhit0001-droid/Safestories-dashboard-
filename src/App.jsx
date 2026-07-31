import React, { useEffect } from 'react';
import { Loader } from './components/Loader.jsx';

function App() {
  useEffect(() => {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const destination = `https://panel.safestories.in${currentPath}${currentSearch}`;
    
    // Attempt the redirect
    setTimeout(() => {
      window.location.replace(destination);
    }, 500);
  }, []);

  return <Loader />;
}

export default App;
