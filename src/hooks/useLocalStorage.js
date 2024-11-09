import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
    // Inicializa o estado
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error('Erro ao carregar dados do localStorage:', error);
            return initialValue;
        }
    });

    // Atualiza o localStorage quando o estado mudar
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error('Erro ao salvar dados no localStorage:', error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
} 