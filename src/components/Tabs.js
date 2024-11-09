import React from 'react';

function Tabs({ activeTab, onSwitchTab }) {
    return (
        <nav className="tabs">
            <button className={`tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => onSwitchTab('add')}>Adicionar</button>
            <button className={`tab ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => onSwitchTab('matrix')}>Matriz</button>
            <button className={`tab ${activeTab === 'kanban' ? 'active' : ''}`} onClick={() => onSwitchTab('kanban')}>Kanban</button>
        </nav>
    );
}

export default Tabs;
