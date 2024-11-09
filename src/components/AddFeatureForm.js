import React, { useState } from 'react';
import { KANBAN_STATUS } from '../constants/statusConstants';

export default function AddFeatureForm({ onSubmit, initialData = null, isEditing = false }) {
    const [featureData, setFeatureData] = useState(() => {
        if (initialData) {
            return {
                ...initialData,
                reach: initialData.reach || '0',
                impact: initialData.impact || '0',
                confidence: initialData.confidence || '0',
                effort: initialData.effort || '1',
                businessImpact: initialData.businessImpact || '3',
                urgency: initialData.urgency || '3'
            };
        }
        return {
            name: '',
            reach: '0',
            impact: '0',
            confidence: '0',
            effort: '1',
            status: KANBAN_STATUS.BACKLOG.value,
            priority: 'medium',
            deadline: '',
            businessImpact: '3',
            urgency: '3',
            isBlocked: false,
            blockReason: ''
        };
    });

    const [prioritizationMethod, setPrioritizationMethod] = useState('simple'); // 'simple' ou 'rice'

    // Frameworks de priorização
    const frameworks = {
        simple: {
            title: "Priorização Simplificada",
            description: "Avaliação rápida baseada em valor vs. esforço",
            fields: [
                {
                    name: "businessImpact",
                    label: "Impacto no Negócio",
                    description: "Qual o impacto esperado nos objetivos do negócio?",
                    options: [
                        { value: 1, label: "Mínimo", description: "Pouco ou nenhum impacto nos objetivos" },
                        { value: 2, label: "Baixo", description: "Impacto pequeno, mas mensurável" },
                        { value: 3, label: "Médio", description: "Impacto moderado nos objetivos" },
                        { value: 4, label: "Alto", description: "Impacto significativo" },
                        { value: 5, label: "Crítico", description: "Impacto crucial para o negócio" }
                    ]
                },
                {
                    name: "urgency",
                    label: "Urgência",
                    description: "Qual a urgência desta funcionalidade?",
                    options: [
                        { value: 1, label: "Baixíssima", description: "Pode esperar indefinidamente" },
                        { value: 2, label: "Baixa", description: "Pode esperar alguns meses" },
                        { value: 3, label: "Média", description: "Deve ser feito no próximo trimestre" },
                        { value: 4, label: "Alta", description: "Deve ser feito no próximo mês" },
                        { value: 5, label: "Urgente", description: "Deve ser feito imediatamente" }
                    ]
                },
                {
                    name: "effort",
                    label: "Esforço",
                    description: "Quanto esforço será necessário?",
                    options: [
                        { value: 5, label: "Mínimo", description: "Poucas horas de trabalho" },
                        { value: 4, label: "Baixo", description: "Alguns dias de trabalho" },
                        { value: 3, label: "Médio", description: "Uma ou duas semanas" },
                        { value: 2, label: "Alto", description: "Um mês ou mais" },
                        { value: 1, label: "Muito Alto", description: "Vários meses de trabalho" }
                    ]
                }
            ]
        },
        rice: {
            title: "Framework RICE",
            description: "Priorização detalhada usando Reach, Impact, Confidence e Effort",
            fields: [
                {
                    name: "reach",
                    label: "Reach (Alcance)",
                    description: "Quantidade estimada de usuários impactados por trimestre",
                    min: 0,
                    max: 1000,
                    step: 100,
                    labels: {
                        min: "0 usuários",
                        max: "1000+ usuários"
                    }
                },
                {
                    name: "impact",
                    label: "Impact (Impacto)",
                    description: "Quanto esta feature contribui para o objetivo?",
                    min: 0,
                    max: 3,
                    step: 1,
                    labels: {
                        min: "Mínimo (0)",
                        max: "Máximo (3)"
                    }
                },
                {
                    name: "confidence",
                    label: "Confidence (Confiança)",
                    description: "Qual seu nível de confiança nas estimativas?",
                    min: 0,
                    max: 100,
                    step: 10,
                    labels: {
                        min: "0%",
                        max: "100%"
                    }
                },
                {
                    name: "effort",
                    label: "Effort (Esforço)",
                    description: "Quantidade de trabalho necessária (em semanas)",
                    min: 1,
                    max: 8,
                    step: 1,
                    labels: {
                        min: "1 semana",
                        max: "8 semanas"
                    }
                }
            ]
        }
    };

    // Função para calcular a pontuação normalizada (0-100)
    const calculateScore = () => {
        if (prioritizationMethod === 'simple') {
            const impact = Number(featureData.businessImpact);
            const urgency = Number(featureData.urgency);
            const effort = Number(featureData.effort);
            
            // Fórmula simplificada: (impacto * urgência * esforço) / máximo possível * 100
            const score = ((impact * urgency * effort) / (5 * 5 * 5)) * 100;
            return score.toFixed(1);
        } else {
            // RICE normalizado para 0-100
            const reach = Number(featureData.reach);
            const impact = Number(featureData.impact);
            const confidence = Number(featureData.confidence) / 100; // Converte para decimal
            const effort = Number(featureData.effort);
            
            // Calcula o RICE score e normaliza
            const riceScore = (reach * impact * confidence) / effort;
            const maxPossibleScore = (1000 * 3 * 1) / 1; // Valores máximos possíveis
            const normalizedScore = (riceScore / maxPossibleScore) * 100;
            
            return normalizedScore.toFixed(1);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFeatureData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!featureData.name.trim()) {
            alert('Por favor, insira um nome para a feature');
            return;
        }
        
        const formattedData = {
            ...featureData,
            id: isEditing ? featureData.id : Date.now().toString(),
            createdAt: isEditing ? featureData.createdAt : new Date().toISOString(),
            reach: Number(featureData.reach) || 0,
            impact: Number(featureData.impact) || 0,
            confidence: Number(featureData.confidence) || 0,
            effort: Number(featureData.effort) || 1,
            priority: featureData.priority || 'medium',
            businessValue: Number(featureData.businessValue) || 0,
            userValue: Number(featureData.userValue) || 0,
            technicalComplexity: Number(featureData.technicalComplexity) || 0,
            risks: Number(featureData.risks) || 0
        };
        
        onSubmit(formattedData);

        // Reset form
        setFeatureData({
            name: '',
            reach: '3',
            impact: '3',
            confidence: '3',
            effort: '3',
            status: KANBAN_STATUS.BACKLOG.value,
            priority: 'medium',
            deadline: '',
            businessValue: '3',
            userValue: '3',
            technicalComplexity: '3',
            risks: '3',
            isBlocked: false,
            blockReason: ''
        });
    };

    // Componente para renderizar os campos
    const PriorityField = ({ field, value, onChange }) => {
        // Se o campo tem options (método simple)
        if (field.options) {
            return (
                <div className="bg-white p-6 rounded-lg border border-emerald-200">
                    <label className="block text-lg font-medium text-emerald-900 mb-2">
                        {field.label}
                        <div className="text-sm text-emerald-600 mt-1">
                            {field.description}
                        </div>
                    </label>
                    <div className="space-y-2">
                        {field.options.map(option => (
                            <label key={option.value} className="flex items-center p-3 rounded-lg hover:bg-emerald-50">
                                <input
                                    type="radio"
                                    name={field.name}
                                    value={option.value}
                                    checked={Number(value) === option.value}
                                    onChange={onChange}
                                    className="w-4 h-4 text-emerald-600"
                                />
                                <div className="ml-3">
                                    <div className="font-medium text-gray-900">{option.label}</div>
                                    <div className="text-sm text-gray-500">{option.description}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            );
        }

        // Se o campo tem min/max (método rice)
        return (
            <div className="bg-white p-6 rounded-lg border border-emerald-200">
                <label className="block text-lg font-medium text-emerald-900 mb-2">
                    {field.label}
                    <div className="text-sm text-emerald-600 mt-1">
                        {field.description}
                    </div>
                </label>
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            name={field.name}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={value}
                            onChange={onChange}
                            className="flex-1 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <input
                            type="number"
                            value={value}
                            onChange={onChange}
                            name={field.name}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            className="w-20 px-2 py-1 text-center border rounded"
                        />
                    </div>
                    <div className="flex justify-between text-xs text-emerald-600">
                        <span>{field.labels.min}</span>
                        <span>{field.labels.max}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isEditing ? 'Editar Feature' : 'Nova Feature'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Informações Básicas */}
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                    <h3 className="text-lg font-semibold text-indigo-800 mb-4">Informações Básicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-indigo-900 mb-2">
                                Nome da Feature *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={featureData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ex: Sistema de Notificações Push"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-indigo-900 mb-2">
                                Data Limite
                            </label>
                            <input
                                type="date"
                                name="deadline"
                                value={featureData.deadline}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-indigo-900 mb-2">
                                Status Inicial
                            </label>
                            <select
                                name="status"
                                value={featureData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {Object.values(KANBAN_STATUS).map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Seleção do Método */}
                <div className="bg-violet-50 p-6 rounded-xl border border-violet-100">
                    <h3 className="text-lg font-semibold text-violet-800 mb-4">Método de Priorização</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setPrioritizationMethod('simple')}
                            className={`p-4 rounded-lg border ${
                                prioritizationMethod === 'simple'
                                    ? 'bg-violet-100 border-violet-300'
                                    : 'bg-white border-violet-200'
                            }`}
                        >
                            <h4 className="font-semibold text-violet-900">Simplificado</h4>
                            <p className="text-sm text-violet-600">Avaliação rápida de valor vs. esforço</p>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setPrioritizationMethod('rice')}
                            className={`p-4 rounded-lg border ${
                                prioritizationMethod === 'rice'
                                    ? 'bg-violet-100 border-violet-300'
                                    : 'bg-white border-violet-200'
                            }`}
                        >
                            <h4 className="font-semibold text-violet-900">RICE Framework</h4>
                            <p className="text-sm text-violet-600">Análise detalhada com múltiplos fatores</p>
                        </button>
                    </div>
                </div>

                {/* Framework Fields */}
                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                    <h3 className="text-lg font-semibold text-emerald-800 mb-4">
                        {frameworks[prioritizationMethod].title}
                    </h3>
                    
                    <div className="space-y-6">
                        {frameworks[prioritizationMethod].fields.map(field => (
                            <PriorityField
                                key={field.name}
                                field={field}
                                value={featureData[field.name]}
                                onChange={handleChange}
                            />
                        ))}
                    </div>

                    {/* Score Final */}
                    <div className="mt-6 bg-emerald-100 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-emerald-800">Pontuação Final</span>
                            <span className="text-2xl font-bold text-emerald-800">{calculateScore()}</span>
                        </div>
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end gap-4 pt-6">
                    <button
                        type="button"
                        onClick={() => setFeatureData({
                            name: '',
                            status: KANBAN_STATUS.BACKLOG.value,
                            reach: '3',
                            impact: '3',
                            confidence: '3',
                            effort: '3',
                            priority: 'medium',
                            deadline: '',
                            businessValue: '3',
                            userValue: '3',
                            technicalComplexity: '3',
                            risks: '3',
                            isBlocked: false,
                            blockReason: ''
                        })}
                        className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Limpar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        {isEditing ? 'Salvar Alterações' : 'Adicionar Feature'}
                    </button>
                </div>
            </form>
        </div>
    );
}