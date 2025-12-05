import { useState, useEffect } from 'react';
import { socketService, ParserStatus } from '../services/socketService';

export const useParserStatus = () => {
  const [parserStatus, setParserStatus] = useState<ParserStatus>({ status: 'idle' });

  useEffect(() => {
    // Функция для получения текущего статуса
    const fetchCurrentStatus = async () => {
      try {
        const response = await fetch('http://localhost:8001/parser/status');
        const data = await response.json();
        if (data.status) {
          setParserStatus({ status: data.status as 'idle' | 'running' | 'completed' | 'error' });
        }
      } catch (error) {
        console.error('Failed to fetch parser status:', error);
      }
    };

    // Получаем текущий статус при загрузке
    fetchCurrentStatus();

    // Подключаемся к WebSocket
    socketService.connect();

    const handleParserStatus = (status: ParserStatus) => {
      console.log('Parser status:', status);
      setParserStatus(status);

      // Автоматически сбрасываем статус "completed" через 5 секунд
      if (status.status === 'completed') {
        setTimeout(() => {
          setParserStatus({ status: 'idle' });
        }, 5000);
      }
    };

    socketService.onParserStatus(handleParserStatus);

    return () => {
      socketService.offParserStatus(handleParserStatus);
    };
  }, []);

  return parserStatus;
};
