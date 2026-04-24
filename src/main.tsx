
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './app/routes.tsx';
import { VaultProvider } from './app/context/VaultContext.tsx';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <VaultProvider>
    <RouterProvider router={router} />
    <Toaster position="top-center" richColors />
  </VaultProvider>
);
  
