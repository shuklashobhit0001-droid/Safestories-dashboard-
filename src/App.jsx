import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Perform client-side redirect preserving the path
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    
    // Only redirect if not already on the destination to prevent infinite loops (though different domains so it's fine)
    const destination = `https://panel.safestories.in${currentPath}${currentSearch}`;
    
    // Update the fallback link href just in case
    const link = document.getElementById('fallback-link');
    if (link) {
      link.href = destination;
    }

    // Attempt the redirect
    setTimeout(() => {
      window.location.replace(destination);
    }, 500); // slight delay to show the UI
  }, []);

  return null; // UI is handled by index.html to load instantly before React boots
}

export default App;
