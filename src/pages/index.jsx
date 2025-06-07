import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Players from "./Players";

import Sessions from "./Sessions";

import Description from "./Description";

import SettingsPage from "./Settings";

import Groups from "./Groups";

import DataCleanup from "./DataCleanup";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Players: Players,
    
    Sessions: Sessions,
    
    Description: Description,
    
    Settings: SettingsPage,
    
    Groups: Groups,
    
    DataCleanup: DataCleanup,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/players" element={<Players />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/description" element={<Description />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/datacleanup" element={<DataCleanup />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router basename="/PokerCashFlow">
            <PagesContent />
        </Router>
    );
}