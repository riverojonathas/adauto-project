import { KANBAN_STATUS } from '../constants/statusConstants';

export type KanbanStatusType = keyof typeof KANBAN_STATUS;

export interface Feature {
    id: string;
    name: string;
    impact: number;
    objective: number;
    score: number;
    status: KanbanStatusType;
    clickArea?: {
        x: number;
        y: number;
        width: number;
        height: number;
        feature: Feature;
    };
} 