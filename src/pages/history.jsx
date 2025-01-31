import React, { useEffect, useState } from 'react';
import { Header } from '../header/Header';
import axios from 'axios';
// import './History.css'; // Убрано тк берёт стиль таблицы users

const History = () => {
    const [history, setHistory] = useState([]);
    const [selectedRow, setSelectedRow] = useState(null); // Состояние для выделенной строки

    // Загрузка истории при монтировании компонента
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axios.get('/get_history');
                setHistory(response.data);
            } catch (error) {
                console.error('Ошибка при загрузке истории:', error);
            }
        };

        fetchHistory();

        // Периодическое обновление истории
        const interval = setInterval(fetchHistory, 5000);

        return () => clearInterval(interval); // Очистка интервала при размонтировании
    }, []);

    // Обработчик клика по строке
    const handleRowClick = (index) => {
        setSelectedRow(index === selectedRow ? null : index); // Выделяем или снимаем выделение
    };

    return (
        <div className="history-page">
            <Header />
            <div className="table-wrapper">
                <table id="data-table">
                    <thead>
                    <tr>
                        <th>Пользователь</th>
                        <th>Метеорит</th>
                        <th>Действие</th>
                        <th>Дата</th>
                    </tr>
                    </thead>
                    <tbody>
                    {history.map((entry, index) => (
                        <tr
                            key={index}
                            className={selectedRow === index ? 'selected' : ''}
                            onClick={() => handleRowClick(index)}
                        >
                            <td>{entry.username}</td>
                            <td>{entry.meteorName}</td>
                            <td>{entry.action}</td>
                            <td>{entry.date}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default History;