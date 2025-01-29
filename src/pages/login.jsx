import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Подключите стили

const Login = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [regLogin, setRegLogin] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Пример загрузки данных
        setLoading(true);
        setTimeout(() => setLoading(false), 500); // Скрываем анимацию через 0.5 секунды
    }, []);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ login, password }),
            });

            const result = await response.json();

            if (result.success) {
                navigate('/main');
            } else {
                setErrorMessage(result.message);
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/register_new_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ regLogin, regPassword }),
            });

            const result = await response.json();

            if (result.success) {
                alert('Регистрация прошла успешно');
                setShowRegisterModal(false);
                setRegLogin('');
                setRegPassword('');
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    };

    return (
        <div className="login-container">
            <h2>Вход</h2>
            <form onSubmit={handleLoginSubmit}>
                <label htmlFor="login">Логин:</label>
                <input
                    type="text"
                    id="login"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                />
                <label htmlFor="password">Пароль:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Войти</button>
                <button type="button" onClick={() => setShowRegisterModal(true)}>
                    Регистрация
                </button>
            </form>
            <div id="errorMessage" style={{ color: 'red' }}>
                {errorMessage}
            </div>

            {showRegisterModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowRegisterModal(false)}>&times;</span>
                        <h2>Регистрация</h2>
                        <form onSubmit={handleRegisterSubmit}>
                            <label htmlFor="regLogin">Логин:</label>
                            <input
                                type="text"
                                id="regLogin"
                                value={regLogin}
                                onChange={(e) => setRegLogin(e.target.value)}
                                required
                            />
                            <label htmlFor="regPassword">Пароль:</label>
                            <input
                                type="password"
                                id="regPassword"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                required
                            />
                            <button type="submit">Зарегистрироваться</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
