import React, { useState } from 'react';
import AddFeatureForm from './components/AddFeatureForm';
import Matrix from './components/Matrix';
import Kanban from './components/Kanban';
import './App.css';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
  const [features, setFeatures] = useLocalStorage('adauto_features', []);
  const [currentPage, setCurrentPage] = useState('matrix');

  const handleAddFeature = (newFeature) => {
    const featureWithId = {
      ...newFeature,
      id: Date.now(),
    };
    setFeatures([...features, featureWithId]);
  };

  const handleUpdateFeature = (updatedFeature) => {
    console.log('Atualizando feature:', updatedFeature);
    
    setFeatures(prevFeatures => 
      prevFeatures.map(feature => 
        feature.id === updatedFeature.id ? updatedFeature : feature
      )
    );
  };

  const handleDeleteFeature = (featureId) => {
    if (window.confirm('Tem certeza que deseja excluir esta feature?')) {
      setFeatures(prev => prev.filter(feature => feature.id !== featureId));
    }
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'matrix':
        return (
          <Matrix 
            features={features} 
            onUpdateFeature={handleUpdateFeature}
            onDeleteFeature={handleDeleteFeature}
          />
        );
      case 'kanban':
        return (
          <Kanban 
            features={features} 
            onUpdateFeature={handleUpdateFeature}
            onDeleteFeature={handleDeleteFeature} 
          />
        );
      case 'addFeature':
        return (
          <AddFeatureForm onSubmit={handleAddFeature} />
        );
      default:
        return <div>Página não encontrada</div>;
    }
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <div className="logo-section">
              <h1 className="main-title">Product Roadmap</h1>
              <p className="header-description">
                Priorize features e gerencie seu roadmap de produto de forma eficiente
              </p>
            </div>

            <nav className="navigation-container">
              <button
                className={`nav-button ${currentPage === 'addFeature' ? 'active' : ''}`}
                onClick={() => setCurrentPage('addFeature')}
              >
                Nova Feature
              </button>
              <button
                className={`nav-button ${currentPage === 'kanban' ? 'active' : ''}`}
                onClick={() => setCurrentPage('kanban')}
              >
                Kanban
              </button>
              <button
                className={`nav-button ${currentPage === 'matrix' ? 'active' : ''}`}
                onClick={() => setCurrentPage('matrix')}
              >
                Matriz
              </button>
            </nav>
          </div>
        </header>

        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;

