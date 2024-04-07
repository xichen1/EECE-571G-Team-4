import { createBrowserRouter } from 'react-router-dom';
import Manufacturer from '@/pages/manufacturer/Manufacturer.tsx';
import Dashboard from '@pages/dashboard/Dashboard.tsx';
import Logistic from '@pages/logistic/Logistic.tsx';
import Retailer from '@pages/retailer/Retailer.tsx';
import Consumer from '@pages/consumer/Consumer.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/manufacturer',
    element: <Manufacturer />,
  },
  {
    path: '/logistic',
    element: <Logistic />,
  },
  {
    path: '/retailer',
    element: <Retailer />,
  },
  {
    path: '/consumer',
    element: <Consumer />,
  },
]);

export default router;
