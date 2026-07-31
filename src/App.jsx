import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const destination = `https://panel.safestories.in${currentPath}${currentSearch}`;
    
    setTimeout(() => {
      window.location.replace(destination);
    }, 500);
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'sans-serif'
    }}>
      <h1>Redirecting to the new dashboard...</h1>
    </div>
  );
}

export default App;
