import { createBrowserRouter } from 'react-router';
import App from './App';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GeneratePassword from './pages/GeneratePassword';
import EntryDetail from './pages/EntryDetail';
import Assistant from './pages/Assistant';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AppLayout from './components/AppLayout';
import Suggestions from './pages/Suggestions';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
  },
  {
    path: '/auth',
    Component: Login,
  },
  {
    Component: AppLayout,
    children: [
      { path: '/dashboard', Component: Dashboard },
      { path: '/generate', Component: GeneratePassword },
      { path: '/assistant', Component: Assistant },
      { path: '/entry/:id', Component: EntryDetail },
      { path: '/suggestions', Component: Suggestions },
    ],
  },
  {
    path: '/privacy-policy',
    Component: PrivacyPolicy,
  },
  {
    path: '/terms-of-service',
    Component: TermsOfService,
  },
]);
