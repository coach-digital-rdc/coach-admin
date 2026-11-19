import { ChakraProvider } from '@chakra-ui/react';
import { lightTheme } from './styles/themes/light';
import UserContextProvider from './contexts/UserContext';
import ReactDOM from 'react-dom/client';
import { Router } from './routes';
import './styles/index.css';
import React from 'react';
import './i18n';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/500.css';
import '@fontsource/noto-sans/600.css';
import '@fontsource/noto-sans/700.css';
import '@fontsource/noto-sans/800.css';
import { CoachLogoCD } from './assets/images/logos';

const changeFavicon = () => {
  const link = document.querySelector('link[rel="icon"]');
  if (link) {
    link.setAttribute('href', CoachLogoCD);
  }
  document.title = 'Coach Digital RDC';
};

changeFavicon();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={lightTheme}>
      <BrowserRouter>
        <UserContextProvider>
          <Router />
        </UserContextProvider>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>,
);
