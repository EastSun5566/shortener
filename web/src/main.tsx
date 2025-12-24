import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom'

import './index.css'

import {
  RootRoute,
  LoginRoute,
  RegisterRoute
} from './routes'
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRoute />
  },
  {
    path: '/login',
    element: <LoginRoute />
  },
  {
    path: '/register',
    element: <RegisterRoute />
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
