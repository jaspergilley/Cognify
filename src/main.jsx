import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nProvider } from './i18n/index.jsx'
import CognifyApp from '../er_cognify.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <CognifyApp />
    </I18nProvider>
  </React.StrictMode>
)
