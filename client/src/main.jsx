// Strictmode helps identify safe React behavior during
// development. It may intentionally run certain logic twice
import { StrictMode } from 'react'

// createRoot attatches the React application to the HTML page
import { createRoot } from 'react-dom/client'

// import global styles
import './index.css'

// App is the top-level component
import App from './App.jsx'

// find <div id="root"> in index.html and render App inside it
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
