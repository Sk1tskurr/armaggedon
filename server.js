const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const app = express();
const port = 3000;

const crypto = require('crypto');
const secretKey = crypto.randomBytes(64).toString('hex');
console.log('Ключ сгенерирован\n' + secretKey);

// Получаем текущую дату и время
const now = new Date();
const formattedDate = now.toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
}).replace(',', '');

// Константа для сравнения (без даты)
const baseInfo = '1|admin|admpss|Ну типа админ, да|';

// Формируем строку с использованием текущей даты и времени
const infoFilePath = path.join(__dirname, 'info.txt');
const infoFilling = `${baseInfo}${formattedDate}`;

fs.readFile(infoFilePath, 'utf8', (err, data) => {
    if (err) {
        if (err.code === 'ENOENT') {
            // Файл не существует, создаем и добавляем строку
            fs.writeFile(infoFilePath, infoFilling + '\n', (err) => {
                if (err) throw err;
                console.log('Файл info.txt создан и строка добавлена.');
            });
        } else {
            throw err;
        }
    } else {
        // Файл существует, проверяем наличие строки без учета даты
        const lines = data.split('\n');
        const exists = lines.some((line) => line.startsWith(baseInfo));

        if (!exists) {
            fs.appendFile(infoFilePath, infoFilling + '\n', (err) => {
                if (err) throw err;
                console.log('Строка профиля admin добавлена в info.txt.');
            });
        } else {
            console.log('Файл info.txt найден, строки по умолчанию заполнены корректно.');
        }
    }
});

const historyFilePath = path.join(__dirname, 'history.txt');

// Проверка и создание файла history.txt, если он не существует
fs.readFile(historyFilePath, 'utf8', (err, data) => {
    if (err && err.code === 'ENOENT') {
        fs.writeFile(historyFilePath, '', (err) => {
            if (err) throw err;
            console.log('Файл history.txt создан.');
        });
    } else if (err) {
        throw err;
    }
});

// Проверка наличия SESSION_SECRET и вывод сообщения
if (process.env.SESSION_SECRET) {
    console.log('Текущий ключ\n' + process.env.SESSION_SECRET);
}
// Настройка сессий
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Установите true, если используете HTTPS
    })
);

// Middleware для проверки авторизации
function checkAuth(req, res, next) {
    if (req.session.isAuthenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Для обработки JSON и URL-кодированных данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Маршрут получения данных из сессии, должен быть перед раздачей статических файлов
app.get('/session-data', (req, res) => {
    if (req.session.isAuthenticated) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).json({ message: 'Пользователь не авторизован' });
    }
});

// Раздача статических файлов
app.use(express.static(path.join(__dirname, 'build')));

// Перенаправление с корневого URL на страницу логина
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Маршрут для входа
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Обработка логина
app.post('/login', (req, res) => {
    const { login, password } = req.body;

    fs.readFile(path.join(__dirname, 'info.txt'), 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Ошибка сервера');
            return;
        }

        const users = data.split('\n').filter((line) => line.trim() !== '');
        const userExists = users.some((user) => {
            const [, storedLogin, storedPassword] = user.split('|');
            return storedLogin === login && storedPassword === password;
        });

        if (userExists) {
            req.session.isAuthenticated = true;
            req.session.username = login; // Сохраняем логин в сессии
            res.json({ success: true, username: login, redirectUrl: '/main' });
        } else {
            res.json({ success: false, message: 'Неверный логин или пароль' });
        }
    });
});

app.post('/register_new_user', (req, res) => {
    const { regLogin, regPassword } = req.body;

    const filePath = path.join(__dirname, 'info.txt');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка чтения файла' });
        }

        const lines = data.trim().split('\n');
        let lastId = 0;
        const isLoginTaken = lines.some((line) => {
            const [id, login] = line.split('|');
            lastId = parseInt(id, 10);
            return login === regLogin;
        });

        if (isLoginTaken) {
            return res.status(400).json({ success: false, message: 'Логин уже существует.' });
        }

        const newId = lastId + 1;
        const description = 'новый пользователь';
        const date = new Date().toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        const newLine = `${newId}|${regLogin}|${regPassword}|${description}|${date}\n`;

        fs.appendFile(filePath, newLine, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Ошибка записи в файл' });
            }

            res.json({ success: true });
        });
    });
});

// Маршрут для главной страницы (требует авторизации)
app.get('/main', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


// Обработка POST-запроса /destroy
app.post('/destroy', checkAuth, (req, res) => {
    const { meteorName } = req.body; // Получаем название метеорита из тела запроса
    const username = req.session.username; // Берем имя пользователя из сессии
    if (!username || !meteorName) {
        return res.status(400).json({ success: false, message: 'Недостаточно данных' });
    }

    const date = new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const newLine = `${username}|${meteorName}|Помещён на уничтожение|${date}\n`;

    fs.appendFile(historyFilePath, newLine, (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка записи в файл' });
        }
        res.json({ success: true });
    });
});

// Обработка POST-запроса /recovery
app.post('/recovery', checkAuth, (req, res) => {
    const { meteorName } = req.body; // Получаем название метеорита из тела запроса
    const username = req.session.username; // Берем имя пользователя из сессии
    if (!username || !meteorName) {
        return res.status(400).json({ success: false, message: 'Недостаточно данных' });
    }

    const date = new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const newLine = `${username}|${meteorName}|Снят с уничтожения|${date}\n`;

    fs.appendFile(historyFilePath, newLine, (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка записи в файл' });
        }
        res.json({ success: true });
    });
});

app.get('/get_history', (req, res) => {
    fs.readFile(historyFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Не удалось прочитать файл' });
        }

        const lines = data.trim().split('\n');
        const history = lines.map(line => {
            const [username, meteorName, action, date] = line.split('|');
            return { username, meteorName, action, date };
        });

        res.json(history);
    });
});


app.get('/history',  checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/users',  checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Маршрут для получения содержимого таблицы
app.get('/get_table_content', checkAuth, (req, res) => {
    const infoFilePath = path.join(__dirname, 'info.txt');

    fs.readFile(infoFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Не удалось прочитать файл' });
        }

        const lines = data.trim().split('\n');
        const tableContent = lines.map(line => {
            const [id, login, password, description, date] = line.split('|');
            return { id, login, password, description, date };
        });

        res.json(tableContent);
    });
});


// Маршрут для сохранения данных
app.post('/save-data', (req, res) => {
    const { id, login, password, description, date } = req.body;

    // Проверка, заполнены ли все поля
    if (!login || !password || !description || !date) {
        return res.json({ success: false, message: 'Все поля должны быть заполнены' });
    }

    fs.readFile(infoFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Ошибка чтения файла:', err);
            return res.status(500).json({ success: false, message: 'Ошибка чтения файла' });
        }

        const lines = data.trim().split('\n');
        let newLines = [];
        let found = false;

        if (!id) {
            const currentDate = new Date();

            // Генерируем новый ID
            const lastId = lines.length > 0 ? parseInt(lines[lines.length - 1].split('|')[0], 10) : 0;
            const newId = lastId + 1;

            // Проверка, существует ли уже такой логин
            const isLoginTaken = lines.some(line => line.split('|')[1] === login);
            if (isLoginTaken) {
                return res.status(400).json({ success: false, message: 'Логин уже существует.' });
            }

            // Форматируем дату
            const formattedDate = currentDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' +
                currentDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

            // Добавляем новую строку
            const newLine = `${newId}|${login}|${password}|${description}|${formattedDate}\n`;
            newLines = [...lines, newLine];
        } else {
            // Редактируем существующую строку
            newLines = lines.map(line => {
                const [lineId] = line.split('|');
                if (lineId === id) {
                    found = true;

                    return `${id}|${login}|${password}|${description}|${date}`;
                }
                return line;
            });

            if (!found) {
                return res.json({ success: false, message: 'Строка не найдена' });
            }
        }

        // Записываем измененные данные обратно в файл
        fs.writeFile(infoFilePath, newLines.join('\n'), 'utf8', (err) => {
            if (err) {
                console.error('Ошибка записи в файл:', err);
                return res.status(500).json({ success: false, message: 'Ошибка записи в файл' });
            }

            res.json({ success: true });
        });
    });
});

// Маршрут для удаления данных
app.post('/delete-data', (req, res) => {
    const { id } = req.body;

    // Проверка наличия id
    if (!id) {
        return res.json({ success: false, message: 'ID не задан' });
    }

    fs.readFile(infoFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.json({ success: false, message: 'Ошибка чтения файла' });
        }

        const lines = data.trim().split('\n');
        const newLines = lines.filter(line => line.split('|')[0] !== id);

        // Проверка, была ли строка найдена и удалена
        if (lines.length === newLines.length) {
            return res.json({ success: false, message: 'Строка не найдена' });
        }

        fs.writeFile(infoFilePath, newLines.join('\n'), 'utf8', (err) => {
            if (err) {
                return res.json({ success: false, message: 'Ошибка записи в файл' });
            }
            res.json({ success: true });
        });
    });
});



// Маршрут для выхода из системы
app.post('/logout', (req, res) => {
    // Проверяем, существует ли сессия
    if (req.session) {
        // Уничтожаем сессию
        req.session.destroy((err) => {
            if (err) {
                // В случае ошибки при уничтожении сессии
                res.status(500).json({ success: false, message: 'Ошибка при завершении сессии' });
            } else {
                // Успешное завершение сессии
                res.clearCookie('connect.sid'); // Очищаем cookie с идентификатором сессии
                res.json({ success: true, message: 'Сессия завершена' });
            }
        });
    } else {
        // Если сессии нет
        res.status(400).json({ success: false, message: 'Сессия не найдена' });
    }
});
// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
