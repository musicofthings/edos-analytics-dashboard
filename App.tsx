import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TestExplorer } from './components/TestExplorer';
import { PricingIntelligence } from './components/PricingIntelligence';
import { Centers } from './components/Centers';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tests" element={<TestExplorer />} />
          <Route path="/pricing" element={<PricingIntelligence />} />
          <Route path="/centers" element={<Centers />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
