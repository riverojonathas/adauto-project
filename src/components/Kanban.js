import React from 'react';
import { KANBAN_STATUS } from '../constants/statusConstants';
import AddFeatureForm from './AddFeatureForm';

export default function Kanban({ features, onUpdateFeature, onDeleteFeature }) {
    const organizedFeatures = {
        BACKLOG: [],
        TODO: [],
        IN_PROGRESS: [],
        DONE: []
    };

    // Organiza as features por status
    features.forEach(feature => {
        const status = feature.status || 'BACKLOG';
        if (organizedFeatures[status]) {
            organizedFeatures[status].push(feature);
        } else {
            organizedFeatures['BACKLOG'].push(feature);
        }
    });

    const handleDragStart = (e, feature) => {
        const cleanFeature = {
            id: feature.id,
            name: feature.name,
            status: feature.status,
            priority: feature.priority,
            reach: feature.reach,
            impact: feature.impact,
            confidence: feature.confidence,
            effort: feature.effort,
            deadline: feature.deadline,
            businessValue: feature.businessValue,
            userValue: feature.userValue,
            technicalComplexity: feature.technicalComplexity,
            risks: feature.risks,
            isBlocked: feature.isBlocked,
            blockReason: feature.blockReason
        };
        
        e.dataTransfer.setData('feature', JSON.stringify(cleanFeature));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, status) => {
        e.preventDefault();
        const feature = JSON.parse(e.dataTransfer.getData('feature'));
        if (feature.status !== status) {
            onUpdateFeature({ ...feature, status });
        }
    };

    const calculateRICEScore = React.useCallback((feature) => {
        // Converte e valida todos os valores
        const reach = parseFloat(feature.reach) || 0;
        const impact = parseFloat(feature.impact) || 0;
        const confidence = (parseFloat(feature.confidence) || 0) / 100; // Converte porcentagem para decimal
        const effort = parseFloat(feature.effort) || 1;
        
        // Calcula o RICE score base
        const riceScore = (reach * impact * confidence) / effort;
        
        // Normaliza para 0-100
        // Considerando valores máximos:
        // reach: 1000, impact: 3, confidence: 1 (100%), effort: 1
        const maxPossibleScore = (1000 * 3 * 1) / 1; // = 3000
        const normalizedScore = (riceScore / maxPossibleScore) * 100;
        
        // Log para debug
        console.log('RICE Score calculation:', {
            feature: feature.name,
            values: {
                reach: reach.toLocaleString(),
                impact,
                confidence: `${(confidence * 100).toFixed(0)}%`,
                effort,
                riceScore: riceScore.toFixed(2),
                normalizedScore: normalizedScore.toFixed(1)
            }
        });
        
        return normalizedScore.toFixed(1);
    }, []);

    // Função para obter peso da prioridade
    const getPriorityWeight = (priority) => {
        const weights = {
            'urgent': 4,
            'high': 3,
            'medium': 2,
            'low': 1
        };
        return weights[priority] || 0;
    };

    // Função atualizada para ordenar features por prioridade e status de bloqueio
    const sortFeatures = (features) => {
        return [...features].sort((a, b) => {
            // Se uma está bloqueada e outra não
            if (a.isBlocked !== b.isBlocked) {
                return a.isBlocked ? 1 : -1;
            }

            // Se ambas estão bloqueadas ou ambas desbloqueadas, ordena por prioridade
            const priorityA = getPriorityWeight(a.priority);
            const priorityB = getPriorityWeight(b.priority);

            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }

            // Se prioridades são iguais, ordena por RICE score
            const riceA = parseFloat(calculateRICEScore(a));
            const riceB = parseFloat(calculateRICEScore(b));
            return riceB - riceA;
        });
    };

    const [expandedCards, setExpandedCards] = React.useState(new Set());
    const [editingFeature, setEditingFeature] = React.useState(null);

    React.useEffect(() => {
        // Mantenha os cards expandidos atualizados
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            features.forEach(feature => {
                if (prev.has(feature.id)) {
                    newSet.add(feature.id);
                }
            });
            return newSet;
        });
    }, [features]);

    const toggleCardExpansion = (featureId) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(featureId)) {
                newSet.delete(featureId);
            } else {
                newSet.add(featureId);
            }
            return newSet;
        });
    };

    const handleFeatureUpdate = (updatedFeature) => {
        const completeUpdatedFeature = {
            ...editingFeature,
            ...updatedFeature,
            id: editingFeature.id,
            reach: Number(updatedFeature.reach) || 0,
            impact: Number(updatedFeature.impact) || 0,
            confidence: Number(updatedFeature.confidence) || 0,
            effort: Number(updatedFeature.effort) || 1,
            priority: updatedFeature.priority || 'medium',
            businessValue: Number(updatedFeature.businessValue) || 0,
            userValue: Number(updatedFeature.userValue) || 0,
            technicalComplexity: Number(updatedFeature.technicalComplexity) || 0
        };
        
        console.log('Feature antes da atualização:', editingFeature);
        console.log('Feature após atualização:', completeUpdatedFeature);
        
        onUpdateFeature(completeUpdatedFeature);
        setEditingFeature(null);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(KANBAN_STATUS).map(([key, value]) => (
                <div 
                    key={key}
                    className="bg-gray-50 p-4 rounded-lg"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, key)}
                >
                    <h3 className="font-bold mb-2" style={{ color: value.color }}>
                        {value.label}
                    </h3>
                    <div className="space-y-2">
                        {sortFeatures(organizedFeatures[key])?.map(feature => (
                            <div
                                key={feature.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, feature)}
                                className={`bg-white rounded-lg shadow cursor-move hover:shadow-md transition-shadow
                                    ${feature.isBlocked ? 'border border-red-500 bg-red-50' : ''}`}
                            >
                                {/* Cabeçalho com botões de controle */}
                                <div className="px-3 py-2 border-b flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onDeleteFeature(feature.id)}
                                            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            title="Excluir"
                                        >
                                            <svg 
                                                className="w-4 h-4" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const blockReason = feature.isBlocked ? '' : 
                                                    prompt('Motivo do bloqueio:');
                                                if (!feature.isBlocked && !blockReason) return;
                                                
                                                onUpdateFeature({
                                                    ...feature,
                                                    isBlocked: !feature.isBlocked,
                                                    blockReason
                                                });
                                            }}
                                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                                                feature.isBlocked 
                                                    ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                                                    : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                                            }`}
                                            title={feature.isBlocked ? 'Desbloquear' : 'Bloquear'}
                                        >
                                            <svg 
                                                className="w-4 h-4" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d={feature.isBlocked 
                                                        ? "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" 
                                                        : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                    }
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setEditingFeature(feature)}
                                            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                            title="Editar"
                                        >
                                            <svg 
                                                className="w-4 h-4" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                                        feature.priority === 'high' ? 'bg-red-100 text-red-800' :
                                        feature.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        {feature.priority.toUpperCase()}
                                    </span>
                                </div>

                                {/* Título da Feature */}
                                <div className="px-4 py-3 border-b">
                                    <h4 className="font-medium text-gray-800">{feature.name}</h4>
                                    {feature.isBlocked && (
                                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                                            <span className="font-semibold">Bloqueado:</span> {feature.blockReason}
                                        </div>
                                    )}
                                </div>

                                {/* Métricas */}
                                <div className="p-4 space-y-3">
                                    {/* RICE Score com botão de expandir */}
                                    <button 
                                        onClick={() => toggleCardExpansion(feature.id)}
                                        className="w-full flex justify-between items-center bg-blue-50 p-2 rounded hover:bg-blue-100 transition-colors"
                                    >
                                        <span className="text-xs text-blue-700">RICE Score</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-blue-800">
                                                {calculateRICEScore(feature)}
                                            </span>
                                            <svg 
                                                className={`w-4 h-4 text-blue-600 transform transition-transform ${
                                                    expandedCards.has(feature.id) ? 'rotate-180' : ''
                                                }`}
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Métricas RICE detalhadas (expandíveis) */}
                                    {expandedCards.has(feature.id) && (
                                        <div className="space-y-3 animate-fadeIn">
                                            <div className="space-y-2">
                                                {[
                                                    { 
                                                        label: 'Reach', 
                                                        value: feature.reach, 
                                                        desc: 'Alcance',
                                                        format: val => Number(val || 0).toLocaleString()
                                                    },
                                                    { 
                                                        label: 'Impact', 
                                                        value: feature.impact, 
                                                        desc: 'Impacto',
                                                        format: val => Number(val || 0).toString()
                                                    },
                                                    { 
                                                        label: 'Confidence', 
                                                        value: feature.confidence, 
                                                        desc: 'Confiança',
                                                        format: val => `${Number(val || 0)}%`
                                                    },
                                                    { 
                                                        label: 'Effort', 
                                                        value: feature.effort, 
                                                        desc: 'Esforço',
                                                        format: val => Number(val || 1).toString()
                                                    }
                                                ].map(({ label, value, desc, format }) => (
                                                    <div key={label} className="bg-gray-50 p-3 rounded flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm font-medium text-gray-700">{label}</div>
                                                            <div className="text-xs text-gray-500">({desc})</div>
                                                        </div>
                                                        <div className="font-medium text-gray-900">
                                                            {format(value)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Prioridade */}
                                            <div className="bg-gray-50 p-3 rounded flex items-center justify-between mt-2">
                                                <span className="text-sm font-medium text-gray-700">Prioridade</span>
                                                <span className={`font-medium px-2 py-0.5 rounded-full ${
                                                    feature.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                    feature.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {feature.priority?.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {editingFeature && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                        {/* Botão de fechar no canto superior direito */}
                        <button
                            onClick={() => setEditingFeature(null)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            title="Fechar"
                        >
                            <svg
                                className="w-5 h-5 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

                        <h3 className="text-xl font-bold mb-4">Editar Feature</h3>
                        <AddFeatureForm
                            initialData={editingFeature}
                            onSubmit={handleFeatureUpdate}
                            isEditing={true}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setEditingFeature(null)}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}