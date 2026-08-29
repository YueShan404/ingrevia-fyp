import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App.jsx'
import { recoverAuthCallbackErrorUrl, recoverMisroutedProductionUrl } from '@/lib/authReturnTo'
import '@/index.css'

if (!recoverMisroutedProductionUrl() && !recoverAuthCallbackErrorUrl()) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  )
}
