import React from 'react';
import Header from './components/Header';
import HomePage_All from './components/HomePage-All';
import HomePage_Motorcycle from './components/HomePage-Motorcycle';
import HomePage_Muscle from './components/HomePage-Muscle';
import HomePage_Sports from './components/HomePage-Sports';
import ProductPage from './components/ProductPage';
import Footer from './components/Footer';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';
import '../styles/main.css';

function App() {
  return (
    <Router>
      <Header/>
      <Routes>
        <Route path="/" element={<HomePage_All />} />
        <Route path="/sports-car" element={<HomePage_Sports />} />
        <Route path="/muscle-car" element={<HomePage_Muscle />} />
        <Route path="/motorcycle" element={<HomePage_Motorcycle />} />
        <Route path="/sports-car/product/3" element={<ProductPage />} />
      </Routes>
      <Footer/>
    </Router>
  );
}

export default App;
