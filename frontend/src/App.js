

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TradingHomePage from './HomePage';
import TradeExecutionPage from './components/TradeExecution';
import ModifyOrderPage from './components/ModifyOrderPage';
import CloseOrderPage from './components/CloseOrderPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TradingHomePage />} />
        <Route path="/execute-order" element={<TradeExecutionPage />} />
        <Route path="/modify-order" element={<ModifyOrderPage />} />
        <Route path="/close-order" element={<CloseOrderPage />} />
      </Routes>
    </Router>
  );
}

export default App;