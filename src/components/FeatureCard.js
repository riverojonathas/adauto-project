import React from 'react';

function FeatureCard({ feature, onUpdate, onDelete }) {
    const handleDelete = () => {
        onDelete(feature.id);
    };

    const getScoreClass = (score) => {
        if (score >= 4) return 'high';
        if (score >= 2.5) return 'medium';
        return 'low';
    };

    return (
        <div className="feature-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '500' }}>{feature.name}</div>
                <div className={`score-pill ${getScoreClass(feature.score)}`}>
                    {feature.score}
                </div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                I: {feature.impact} • O: {feature.objective} • V: {feature.value}
            </div>
            <div className="actions">
                <button className="btn" onClick={() => { /* Lógica para editar */ }}>Editar</button>
                <button className="btn btn-danger" onClick={handleDelete}>Deletar</button>
            </div>
        </div>
    );
}

export default FeatureCard;
