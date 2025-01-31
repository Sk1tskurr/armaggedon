
import React, { useState, useEffect } from 'react';
import './users.css';
import ConfirmationModal from './ConfirmationModal';
import { Header } from '../header/Header';
import Loading from '../loading/Loading';

const UsersPage = () => {
    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [selectedRowId, setSelectedRowId] = useState(null);
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [formData, setFormData] = useState({
        id: '',
        login: '',
        password: '',
        description: '',
        date: ''
    });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [confirmationAction, setConfirmationAction] = useState(null);
    const [username, setUsername] = useState('');

    useEffect(() => {
        setLoading(true); // Устанавливаем состояние загрузки при монтировании компонента
        fetchSessionData();
        fetchTableContent().finally(() => setLoading(false)); // Сбрасываем состояние загрузки после загрузки данных
    }, []);

    const fetchSessionData = () => {

        fetch('/session-data')
            .then(response => response.json())
            .then(sessionData => {
                setUsername(sessionData.username); // Сохраняем username в состояние
            })
            .catch(error => console.error('Ошибка получения данных о сессии:', error));
    };

    const fetchTableContent = () => {
        return fetch('/get_table_content')
            .then(response => response.json())
            .then(data => setTableData(data))
            .catch(error => console.error('Ошибка:', error));
    };

    const handleRowClick = (row) => {
        setSelectedRowId(row.id);
        setSelectedRowData(row);
    };

    const handleAddString = () => {
        setLoading(true); // Устанавливаем состояние загрузки
        setTimeout(() => {
            setFormData({
                id: '',
                login: '',
                password: '',
                description: '',
                date: ''
            });
            setModalMode('add');
            setShowModal(true);
            setLoading(false); // Сбрасываем состояние загрузки после 0.5 секунд
        }, 500);
    };

    const handleEditString = () => {
        if (selectedRowData) {
            setLoading(true); // Устанавливаем состояние загрузки
            setTimeout(() => {
                setFormData({
                    id: selectedRowData.id,
                    login: selectedRowData.login,
                    password: selectedRowData.password,
                    description: selectedRowData.description,
                    date: selectedRowData.date
                });
                setModalMode('edit');
                setShowModal(true);
                setLoading(false); // Сбрасываем состояние загрузки после 0.5 секунд
            }, 500);
        } else {
            alert("Пожалуйста, выберите строку для изменения.");
        }
    };

    const handleDeleteString = () => {
        if (selectedRowId) {
            setLoading(true); // Устанавливаем состояние загрузки
            setTimeout(() => {
                setConfirmationMessage(`Вы уверены, что хотите удалить строку с ID: ${selectedRowId}?`);
                setConfirmationAction(() => () => {
                    fetch('/delete-data', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ id: selectedRowId })
                    })
                        .then(response => response.json())
                        .then(result => {
                            if (result.success) {
                                alert('Строка успешно удалена');
                                fetchTableContent();
                            } else {
                                alert('Ошибка при удалении строки');
                            }
                        })
                        .catch(error => console.error('Ошибка:', error))
                        .finally(() => {
                            setShowConfirmation(false); // Закрываем модальное окно
                            setLoading(false); // Сбрасываем состояние загрузки
                        });
                });
                setShowConfirmation(true);
                setLoading(false); // Сбрасываем состояние загрузки после 0.5 секунд
            }, 500);
        } else {
            alert("Пожалуйста, выберите строку для удаления.");
        }
    };

    const handleFormSubmit = (event) => {
        event.preventDefault();

        const data = {
            id: formData.id,
            login: formData.login,
            password: formData.password,
            description: formData.description,
            date: formData.date
        };

        setLoading(true); // Устанавливаем состояние загрузки
        fetch('/save-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('Данные успешно сохранены');
                    setShowModal(false);
                    fetchTableContent();
                } else {
                    alert('Ошибка при сохранении данных: ' + result.message);
                }
            })
            .catch(error => console.error('Ошибка:', error))
            .finally(() => setLoading(false)); // Сбрасываем состояние загрузки после завершения запроса
    };



    return (
        <div className="main-page-container">
            {loading && <Loading />}
            <Header username={username} />
            <div className="users_page-container">
                <div className="table-wrapper">
                    <table id="data-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Пароль</th>
                            <th>Какой то текст</th>
                            <th>Дата</th>
                        </tr>
                        </thead>
                        <tbody>
                        {tableData.map(row => (
                            <tr
                                key={row.id}
                                onClick={() => handleRowClick(row)}
                                className={selectedRowId === row.id ? 'selected' : ''}
                            >
                                <td>{row.id}</td>
                                <td>{row.login}</td>
                                {/* Если username не admin, отображаем ****** вместо пароля */}
                                <td>{username === 'admin' ? row.password : '******'}</td>
                                <td>{row.description}</td>
                                <td>{row.date}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {username === 'admin' && (
                    <div className="button-container">
                        <button onClick={handleAddString}>Добавить</button>
                        <button onClick={handleEditString}>Изменить</button>
                        <button onClick={handleDeleteString}>Удалить</button>
                    </div>
                )}
                {/*заполнение и показ модального окна*/}
                {showModal && (
                    <div id="usersPageModal" className="modal">
                        <div className="modal-content">
                            <span className="close" onClick={() => setShowModal(false)}>&times;</span>
                            <form id="modalForm" onSubmit={handleFormSubmit}>
                                <div>
                                    <label htmlFor="modalId" id="labelId"
                                           style={{display: modalMode === 'edit' ? 'block' : 'none'}}>Id:</label>
                                    <input type="text" id="modalId" value={formData.id} readOnly
                                           style={{display: modalMode === 'edit' ? 'block' : 'none'}}/>
                                </div>
                                <div>
                                    <label htmlFor="modalLogin">Логин:</label>
                                    <input type="text" id="modalLogin" value={formData.login}
                                           onChange={(e) => setFormData({...formData, login: e.target.value})}/>
                                </div>
                                <div>
                                    <label htmlFor="modalPassword">Пароль:</label>
                                    <input type="text" id="modalPassword" value={formData.password}
                                           onChange={(e) => setFormData({...formData, password: e.target.value})}/>
                                </div>
                                <div>
                                    <label htmlFor="modalDescription">Описание:</label>
                                    <input type="text" id="modalDescription" value={formData.description}
                                           onChange={(e) => setFormData({...formData, description: e.target.value})}/>
                                </div>
                                <div>
                                    <label htmlFor="modalDate" id="labelDate"
                                           style={{display: modalMode === 'edit' ? 'block' : 'none'}}>Дата
                                        регистрации:</label>
                                    <input type="text" id="modalDate" value={formData.date} readOnly
                                           style={{display: modalMode === 'edit' ? 'block' : 'none'}}/>
                                </div>
                                <button type="submit">Сохранить</button>
                            </form>
                        </div>
                    </div>
                )}

                {showConfirmation && (
                    <ConfirmationModal
                        message={confirmationMessage}
                        onConfirm={confirmationAction}
                        onCancel={() => setShowConfirmation(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default UsersPage;
