import React, {lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
const LiveApp = lazy(() => import('./LiveApp'));
createRoot(document.getElementById('root')).render(<Suspense fallback={<div className="auth-shell" role="status">Loading After Hours…</div>}><LiveApp/></Suspense>);
