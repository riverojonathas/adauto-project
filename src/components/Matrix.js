import React, { useRef, useState, useEffect, useCallback } from 'react';
import { KANBAN_STATUS } from '../constants/statusConstants';

// Primeiro, vamos adicionar as cores para cada status
const statusColors = {
    backlog: {  // Deve corresponder ao KANBAN_STATUS.BACKLOG.value
        bg: 'rgba(100, 116, 139, 0.08)',
        text: '#64748b',
        activeBg: 'rgba(100, 116, 139, 0.16)',
        activeText: '#475569'
    },
    in_progress: {  // Deve corresponder ao KANBAN_STATUS.IN_PROGRESS.value
        bg: 'rgba(79, 70, 229, 0.08)',
        text: '#4F46E5',
        activeBg: 'rgba(79, 70, 229, 0.16)',
        activeText: '#3730A3'
    },
    done: {  // Deve corresponder ao KANBAN_STATUS.DONE.value
        bg: 'rgba(16, 185, 129, 0.08)',
        text: '#10B981',
        activeBg: 'rgba(16, 185, 129, 0.16)',
        activeText: '#047857'
    },
    blocked: {
        bg: 'rgba(239, 68, 68, 0.08)',
        text: '#EF4444',
        activeBg: 'rgba(239, 68, 68, 0.16)',
        activeText: '#DC2626'
    }
};

export default function Matrix({ features, onUpdateFeature, onDeleteFeature }) {
    const canvasRef = useRef(null);
    const [editingFeature, setEditingFeature] = useState(null);
    const [scrollPositions, setScrollPositions] = useState({
        high_value: 0,
        quick_wins: 0,
        strategic: 0,
        foundation: 0
    });
    const [tooltip, setTooltip] = useState({ visible: false, feature: null, x: 0, y: 0 });
    const [filters, setFilters] = useState({
        showBlocked: false,
        status: [] // array de status selecionados
    });

    const colors = {
        high_value: { 
            bg: 'rgba(79, 70, 229, 0.08)', 
            text: '#4F46E5',
            gradient: ['#4F46E5', '#3730A3'],
            border: 'rgba(79, 70, 229, 0.2)',
            label: 'ALTO VALOR',
            description: 'Alto impacto, maior esforço'
        },
        quick_wins: { 
            bg: 'rgba(16, 185, 129, 0.08)', 
            text: '#10B981',
            gradient: ['#10B981', '#047857'],
            border: 'rgba(16, 185, 129, 0.2)',
            label: 'QUICK WINS',
            description: 'Alto impacto, menor esforço'
        },
        strategic: { 
            bg: 'rgba(249, 115, 22, 0.08)', 
            text: '#F97316',
            gradient: ['#F97316', '#C2410C'],
            border: 'rgba(249, 115, 22, 0.2)',
            label: 'ESTRATÉGICO',
            description: 'Baixo impacto, maior esforço'
        },
        foundation: { 
            bg: 'rgba(124, 58, 237, 0.08)', 
            text: '#7C3AED',
            gradient: ['#7C3AED', '#5B21B6'],
            border: 'rgba(124, 58, 237, 0.2)',
            label: 'FUNDAÇÃO',
            description: 'Baixo impacto, menor esforço'
        }
    };

    const getValidStatus = (status) => {
        return KANBAN_STATUS[status] ? status : KANBAN_STATUS.BACKLOG.value;
    };

    const calculateScore = (feature) => {
        const reach = Number(feature.reach);
        const impact = Number(feature.impact);
        const confidence = Number(feature.confidence) / 100;
        const effort = Number(feature.effort);
        
        return ((reach * impact * confidence) / effort);
    };

    const organizeFeatures = (features) => {
        const quadrants = {
            high_value: [],
            quick_wins: [],
            strategic: [],
            foundation: [],
            blocked: features.filter(f => f.isBlocked)
        };

        // Filtra features baseado nos filtros selecionados
        let featuresToShow = features;
        if (filters.status.length > 0) {
            featuresToShow = featuresToShow.filter(f => filters.status.includes(f.status));
        }

        // Organiza todas as features nos quadrantes, incluindo as bloqueadas
        featuresToShow.forEach(feature => {
            const quadrant = getQuadrant(feature.impact, feature.effort);
            const score = calculateScore(feature);
            quadrants[quadrant].push({ ...feature, score });
        });

        // Ordena por score em cada quadrante
        Object.keys(quadrants).forEach(key => {
            if (key !== 'blocked') {
                quadrants[key].sort((a, b) => b.score - a.score);
            }
        });

        return quadrants;
    };

    const getQuadrant = (impact, objective) => {
        if (impact > 2.5) {
            return objective > 2.5 ? 'high_value' : 'quick_wins';
        } else {
            return objective > 2.5 ? 'strategic' : 'foundation';
        }
    };

    const calculateStats = () => {
        const stats = {
            total: features.length,
            blocked: features.filter(f => f.isBlocked).length,
            byStatus: {}
        };

        Object.values(KANBAN_STATUS).forEach(status => {
            stats.byStatus[status.value] = features.filter(f => f.status === status.value).length;
        });

        return stats;
    };

    const drawQuadrantFeatures = (ctx, features, x, y, width, height, color, quadrantKey) => {
        const padding = 24;
        const itemHeight = 50;
        const itemSpacing = 12;
        const itemWidth = width - (padding * 2);
        const startX = x + padding;
        const startY = y + padding;
        const quadrantVisibleHeight = height - (padding * 2);
        const scrollOffset = scrollPositions[quadrantKey] || 0;

        // Background do quadrante com sombra suave
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 8, width - 16, height - 16, 12);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Borda delicada com a cor do quadrante
        ctx.strokeStyle = color.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 8, width - 16, height - 16, 12);
        ctx.stroke();

        // Linha indicadora do quadrante
        ctx.strokeStyle = color.text;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY + 40);
        ctx.lineTo(startX + 40, startY + 40);
        ctx.stroke();

        // Título e descrição com tipografia mais moderna
        ctx.font = '600 16px Inter, system-ui, sans-serif';
        ctx.fillStyle = color.text;
        ctx.textAlign = 'left';
        ctx.fillText(color.label, startX + 48, startY + 24);
        
        ctx.font = '400 13px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(color.description, startX + 48, startY + 44);

        // Features
        features.forEach((feature, index) => {
            const yPos = startY + 80 + (index * (itemHeight + itemSpacing)) - scrollOffset;
            
            if (yPos + itemHeight > startY && yPos < startY + quadrantVisibleHeight) {
                // Card da feature
                ctx.fillStyle = feature.isBlocked ? '#FEF2F2' : '#ffffff';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 1;
                ctx.beginPath();
                ctx.roundRect(startX, yPos, itemWidth, itemHeight, 8);
                ctx.fill();
                ctx.shadowColor = 'transparent';

                // Posição inicial para elementos
                let currentX = startX + 12;
                const statusY = yPos + 16;

                // Indicador de bloqueio ou número da posição
                ctx.textAlign = 'left';
                if (feature.isBlocked) {
                    ctx.fillStyle = '#DC2626';
                    ctx.font = '400 12px Inter, system-ui, sans-serif';
                    ctx.fillText('🔒', currentX, statusY + 15);
                } else {
                    ctx.fillStyle = '#64748b';
                    ctx.font = '500 12px Inter, system-ui, sans-serif';
                    ctx.fillText(`${index + 1}`, currentX + 4, statusY + 15);
                }
                currentX += 24; // Mesmo espaçamento para ambos os casos

                // Status badge
                const status = KANBAN_STATUS[feature.status]?.label || 'Backlog';
                ctx.font = '500 12px Inter, system-ui, sans-serif';
                const statusWidth = ctx.measureText(status).width + 16;
                const statusHeight = 22;
                
                // Background do status
                ctx.fillStyle = feature.isBlocked ? '#FEE2E2' : `${color.bg}`;
                ctx.beginPath();
                ctx.roundRect(currentX, statusY, statusWidth, statusHeight, 6);
                ctx.fill();

                // Texto do status
                ctx.fillStyle = feature.isBlocked ? '#EF4444' : color.text;
                ctx.textAlign = 'left';
                ctx.fillText(status, currentX + 8, statusY + 15);

                // Nome da feature
                const nameX = currentX + statusWidth + 12;
                const nameWidth = itemWidth - statusWidth - 160 - (feature.isBlocked ? 24 : 0);
                ctx.font = '500 14px Inter, system-ui, sans-serif';
                ctx.fillStyle = feature.isBlocked ? '#DC2626' : '#1e293b';
                const truncatedName = truncateText(ctx, feature.name, nameWidth);
                ctx.fillText(truncatedName, nameX, statusY + 15);

                // Data (se existir)
                if (feature.deadline) {
                    const date = new Date(feature.deadline).toLocaleDateString();
                    ctx.font = '400 12px Inter, system-ui, sans-serif';
                    ctx.fillStyle = '#64748b';
                    ctx.textAlign = 'right';
                    ctx.fillText(date, startX + itemWidth - 80, statusY + 15);
                }

                // Score (mantido à direita)
                const score = feature.score ? feature.score.toFixed(1) : 'N/A';
                ctx.font = '600 14px Inter, system-ui, sans-serif';
                ctx.fillStyle = color.text;
                ctx.textAlign = 'right';
                ctx.fillText(score, startX + itemWidth - 16, statusY + 15);

                feature.clickArea = {
                    x: startX,
                    y: yPos,
                    width: itemWidth,
                    height: itemHeight,
                    feature: feature
                };
            }
        });

        // Scroll indicator mais discreto
        if (features.length * (itemHeight + itemSpacing) > quadrantVisibleHeight) {
            const scrollBarWidth = 4;
            const scrollBarHeight = quadrantVisibleHeight * (quadrantVisibleHeight / (features.length * (itemHeight + itemSpacing)));
            const scrollBarX = x + width - scrollBarWidth - 12;
            const scrollBarY = y + padding + (scrollOffset / (features.length * (itemHeight + itemSpacing))) * quadrantVisibleHeight;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.beginPath();
            ctx.roundRect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight, 2);
            ctx.fill();
        }
    };

    const truncateText = (ctx, text, maxWidth) => {
        if (ctx.measureText(text).width <= maxWidth) return text;
        let truncated = text;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
        }
        return truncated + '...';
    };

    const handleCanvasClick = useCallback((event) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = (event.clientX - rect.left) * dpr;
        const y = (event.clientY - rect.top) * dpr;

        const organizedFeatures = organizeFeatures(features);
        Object.values(organizedFeatures).forEach(quadrantFeatures => {
            quadrantFeatures.forEach(feature => {
                if (feature.clickArea && isPointInRect(x/dpr, y/dpr, feature.clickArea)) {
                    setEditingFeature(feature);
                }
            });
        });
    }, [features, organizeFeatures]);

    const isPointInRect = (x, y, rect) => {
        return x >= rect.x && 
               x <= rect.x + rect.width && 
               y >= rect.y && 
               y <= rect.y + rect.height;
    };

    // Função para determinar em qual quadrante o mouse está
    const determineQuadrant = (x, y) => {
        const canvas = canvasRef.current;
        const width = canvas.width;
        const height = canvas.height;
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        // Ajuste as coordenadas baseado no DPI do dispositivo
        const dpi = window.devicePixelRatio;
        const adjustedX = x * dpi;
        const adjustedY = y * dpi;

        // Determina o quadrante baseado na posição do mouse
        if (adjustedY < halfHeight) {
            if (adjustedX < halfWidth) {
                return 'quick_wins';
            } else {
                return 'high_value';
            }
        } else {
            if (adjustedX < halfWidth) {
                return 'foundation';
            } else {
                return 'strategic';
            }
        }
    };

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Ajusta as coordenadas considerando o DPI
        const x = (e.clientX - rect.left) * dpr;
        const y = (e.clientY - rect.top) * dpr;
        
        const quadrant = determineQuadrant(x, y);
        if (quadrant) {
            const quadrantFeatures = organizeFeatures(features)[quadrant];
            const itemHeight = 50;
            const itemSpacing = 12;
            const startY = 95;
            
            // Calcula altura total do conteúdo
            const totalHeight = quadrantFeatures.length * (itemHeight + itemSpacing);
            const visibleHeight = (rect.height * dpr / 2) - startY - 20; // 20 é o padding
            const maxScroll = Math.max(0, totalHeight - visibleHeight);

            setScrollPositions(prev => ({
                ...prev,
                [quadrant]: Math.min(Math.max(0, prev[quadrant] + e.deltaY), maxScroll)
            }));
        }
    }, [features]);

    const drawMatrix = useCallback(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Ajusta o canvas para a resolução da tela
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Limpa o canvas
        ctx.clearRect(0, 0, rect.width, rect.height);

        const organizedFeatures = organizeFeatures(features);
        const halfWidth = rect.width / 2;
        const halfHeight = rect.height / 2;

        if (filters.showBlocked) {
            // Desenha apenas as features bloqueadas em tela cheia
            drawBlockedFeatures(ctx, organizedFeatures.blocked, 0, 0, rect.width, rect.height);
        } else {
            // Desenha a matriz normal com os quadrantes
            drawQuadrantFeatures(ctx, organizedFeatures.quick_wins, 0, 0, halfWidth, halfHeight, colors.quick_wins, 'quick_wins');
            drawQuadrantFeatures(ctx, organizedFeatures.high_value, halfWidth, 0, halfWidth, halfHeight, colors.high_value, 'high_value');
            drawQuadrantFeatures(ctx, organizedFeatures.foundation, 0, halfHeight, halfWidth, halfHeight, colors.foundation, 'foundation');
            drawQuadrantFeatures(ctx, organizedFeatures.strategic, halfWidth, halfHeight, halfWidth, halfHeight, colors.strategic, 'strategic');

            // Adiciona seção de bloqueadas abaixo da matriz
            if (organizedFeatures.blocked.length > 0) {
                const blockedSectionY = rect.height;
                drawBlockedFeatures(ctx, organizedFeatures.blocked, 0, blockedSectionY, rect.width, 200);
            }
        }
    }, [features, filters, colors, scrollPositions]);

    // Atualiza quando o scroll muda
    useEffect(() => {
        drawMatrix();
    }, [drawMatrix]);

    // Event listener para o wheel
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('wheel', handleWheel, { passive: false });
            return () => canvas.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

    const handleMouseMove = useCallback((event) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = (event.clientX - rect.left) * dpr;
        const y = (event.clientY - rect.top) * dpr;

        let foundFeature = null;
        const organizedFeatures = organizeFeatures(features);
        
        Object.values(organizedFeatures).forEach(quadrantFeatures => {
            quadrantFeatures.forEach(feature => {
                if (feature.clickArea && isPointInRect(x/dpr, y/dpr, feature.clickArea)) {
                    foundFeature = feature;
                }
            });
        });

        if (foundFeature) {
            setTooltip({
                visible: true,
                feature: foundFeature,
                x: event.clientX,
                y: event.clientY
            });
        } else {
            setTooltip(prev => ({ ...prev, visible: false }));
        }
    }, [features, organizeFeatures, isPointInRect]);

    const handleMouseLeave = useCallback(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
    }, []);

    // Adicione os event listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mouseleave', handleMouseLeave);
            return () => {
                canvas.removeEventListener('mousemove', handleMouseMove);
                canvas.removeEventListener('mouseleave', handleMouseLeave);
            };
        }
    }, [handleMouseMove, handleMouseLeave]);

    // Atualização do componente FilterBar
    const FilterBar = () => (
        <div className="navigation-container mb-4">
            <div className="flex gap-2 items-center">
                {/* Status com cores correspondentes */}
                {Object.values(KANBAN_STATUS).map(status => {
                    const isActive = filters.status.includes(status.value);
                    const colors = statusColors[status.value.toLowerCase()];
                    
                    if (!colors) return null;
                    
                    return (
                        <button
                            key={status.value}
                            onClick={() => {
                                setFilters(prev => ({
                                    ...prev,
                                    status: prev.status.includes(status.value)
                                        ? prev.status.filter(s => s !== status.value)
                                        : [...prev.status, status.value]
                                }));
                            }}
                            style={{
                                backgroundColor: isActive ? colors.activeBg : colors.bg,
                                color: isActive ? colors.activeText : colors.text,
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontWeight: isActive ? '600' : '500',
                                transition: 'all 0.2s ease'
                            }}
                            className="nav-button hover:opacity-90"
                        >
                            {status.label}
                        </button>
                    );
                })}

                {/* Filtro de Bloqueados */}
                <button
                    onClick={() => {
                        setFilters(prev => ({
                            ...prev,
                            status: prev.status.includes('blocked')
                                ? prev.status.filter(s => s !== 'blocked')
                                : [...prev.status, 'blocked']
                        }));
                    }}
                    style={{
                        backgroundColor: filters.status.includes('blocked') ? statusColors.blocked.activeBg : statusColors.blocked.bg,
                        color: filters.status.includes('blocked') ? statusColors.blocked.activeText : statusColors.blocked.text,
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: filters.status.includes('blocked') ? '600' : '500',
                        transition: 'all 0.2s ease'
                    }}
                    className="nav-button hover:opacity-90"
                >
                    Bloqueados
                </button>
            </div>
        </div>
    );

    // Nova função para desenhar features bloqueadas
    const drawBlockedFeatures = (ctx, features, x, y, width, height) => {
        const padding = 20;
        const itemHeight = 50;
        const itemSpacing = 12;
        const itemWidth = width - (padding * 2);
        const startX = x + padding;
        const startY = y + padding;
        const visibleHeight = height - (padding * 2);
        const scrollOffset = scrollPositions.blocked || 0;

        // Título da seção
        ctx.font = 'bold 24px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'left';
        ctx.fillText('Features Bloqueadas', startX, startY + 40);

        // Desenhar cada feature bloqueada
        features.forEach((feature, index) => {
            const yPos = startY + 80 + (index * (itemHeight + itemSpacing)) - scrollOffset;
            
            if (yPos + itemHeight > startY && yPos < startY + visibleHeight) {
                // Background do item
                ctx.fillStyle = '#FEE2E2';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetY = 2;
                ctx.beginPath();
                ctx.roundRect(startX, yPos, itemWidth, itemHeight, 8);
                ctx.fill();
                ctx.shadowColor = 'transparent';

                // Status da feature
                const statusX = startX + 50;
                const statusY = yPos + itemHeight/2 + 4;
                const status = KANBAN_STATUS[feature.status]?.label || 'Backlog';
                
                // Background do status
                ctx.font = '12px Inter, system-ui, sans-serif';
                const statusWidth = ctx.measureText(status).width + 16;
                const statusHeight = 22;
                const statusBgY = statusY - 15;
                
                ctx.fillStyle = '#FEF2F2';
                ctx.beginPath();
                ctx.roundRect(statusX, statusBgY, statusWidth, statusHeight, 6);
                ctx.fill();

                // Texto do status
                ctx.fillStyle = '#EF4444';
                ctx.textAlign = 'left';
                ctx.fillText(status, statusX + 8, statusY);

                // Nome da feature
                const nameX = statusX + statusWidth + 20;
                ctx.font = '14px Inter, system-ui, sans-serif';
                ctx.fillStyle = '#1e293b';
                ctx.fillText(feature.name, nameX, statusY);

                // Motivo do bloqueio
                ctx.font = '12px Inter, system-ui, sans-serif';
                ctx.fillStyle = '#ef4444';
                ctx.fillText(`Bloqueado: ${feature.blockReason}`, nameX, statusY + 16);

                // Área clicável
                feature.clickArea = {
                    x: startX,
                    y: yPos,
                    width: itemWidth,
                    height: itemHeight,
                    feature: feature
                };
            }
        });
    };

    // Ajuste no tooltip para evitar erros
    const Tooltip = ({ feature, x, y }) => {
        if (!feature) return null;

        return (
            <div 
                className="absolute bg-white p-4 rounded-lg shadow-lg text-sm z-50"
                style={{
                    left: Math.min(x + 10, window.innerWidth - 320),
                    top: Math.min(y + 10, window.innerHeight - 200),
                    maxWidth: '300px',
                    pointerEvents: 'auto' // Permite interação com o tooltip
                }}
            >
                <h4 className="font-semibold mb-2">{feature.name}</h4>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <p><strong>RICE:</strong> {feature.score?.toFixed(1) || 'N/A'}</p>
                        <p><strong>Reach:</strong> {feature.reach}</p>
                        <p><strong>Impact:</strong> {feature.impact}</p>
                        <p><strong>Confidence:</strong> {feature.confidence}%</p>
                    </div>
                    <div>
                        <p><strong>Effort:</strong> {feature.effort}</p>
                        <p><strong>Status:</strong> {KANBAN_STATUS[feature.status]?.label}</p>
                        {feature.deadline && (
                            <p><strong>Deadline:</strong> {new Date(feature.deadline).toLocaleDateString()}</p>
                        )}
                    </div>
                </div>
                
                {feature.isBlocked && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-red-600 text-xs">
                        <strong>Bloqueado:</strong> {feature.blockReason}
                    </div>
                )}

                <div className="mt-3 flex justify-end gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const blockReason = feature.isBlocked ? '' : 
                                prompt('Motivo do bloqueio:');
                            if (!feature.isBlocked && !blockReason) return;
                            
                            onUpdateFeature({
                                ...feature,
                                isBlocked: !feature.isBlocked,
                                blockReason
                            });
                        }}
                        className={`px-3 py-1 rounded-md text-sm ${
                            feature.isBlocked 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                    >
                        {feature.isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                </div>

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => {
                            setEditingFeature(feature);
                            setTooltip({ visible: false });
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Editar
                    </button>
                    <button
                        onClick={() => {
                            onDeleteFeature(feature.id);
                            setTooltip({ visible: false });
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Excluir
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="matrix-container">
            <FilterBar />
            <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ 
                    width: '100%', 
                    height: '700px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    background: '#ffffff',
                    cursor: 'pointer'
                }}
            />
            
            {tooltip.visible && tooltip.feature && (
                <Tooltip 
                    feature={tooltip.feature} 
                    x={tooltip.x} 
                    y={tooltip.y} 
                />
            )}

            {editingFeature && (
                <div className="feature-edit-modal">
                    <div className="modal-content bg-white p-6 rounded-lg shadow-lg max-w-2xl">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2">{editingFeature.name}</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p><strong>RICE Score:</strong> {editingFeature.score ? editingFeature.score.toFixed(1) : 'N/A'}</p>
                                    <p><strong>Reach:</strong> {editingFeature.reach}</p>
                                    <p><strong>Impact:</strong> {editingFeature.impact}</p>
                                    <p><strong>Confidence:</strong> {editingFeature.confidence}%</p>
                                    <p><strong>Effort:</strong> {editingFeature.effort}</p>
                                </div>
                                <div>
                                    <p><strong>Business Value:</strong> {editingFeature.businessValue}</p>
                                    <p><strong>User Value:</strong> {editingFeature.userValue}</p>
                                    <p><strong>Technical Complexity:</strong> {editingFeature.technicalComplexity}</p>
                                    <p><strong>Risks:</strong> {editingFeature.risks}</p>
                                    {editingFeature.deadline && (
                                        <p><strong>Deadline:</strong> {new Date(editingFeature.deadline).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 mb-4">
                            <select
                                value={getValidStatus(editingFeature.status)}
                                onChange={(e) => {
                                    const updatedFeature = {
                                        ...editingFeature,
                                        status: e.target.value
                                    };
                                    onUpdateFeature(updatedFeature);
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                {Object.values(KANBAN_STATUS).map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => {
                                    const blockReason = editingFeature.isBlocked ? '' : 
                                        prompt('Motivo do bloqueio:');
                                    if (!editingFeature.isBlocked && !blockReason) return;
                                    
                                    const updatedFeature = {
                                        ...editingFeature,
                                        isBlocked: !editingFeature.isBlocked,
                                        blockReason
                                    };
                                    onUpdateFeature(updatedFeature);
                                }}
                                className={`px-4 py-2 rounded-lg ${
                                    editingFeature.isBlocked 
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                            >
                                {editingFeature.isBlocked ? 'Desbloquear' : 'Bloquear'}
                            </button>
                        </div>

                        {editingFeature.isBlocked && (
                            <div className="text-sm text-red-600 mb-4 bg-red-100 p-2 rounded">
                                <span className="font-semibold">Bloqueado:</span> {editingFeature.blockReason}
                            </div>
                        )}

                        <button
                            onClick={() => setEditingFeature(null)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}