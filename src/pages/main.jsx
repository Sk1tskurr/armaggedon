import React, { useEffect, useState } from 'react';
import { Header } from '../header/Header';
import axios from 'axios';
import './Main.css';
import dangerImage from '../images/danger.png';
import notDangerImage from '../images/not_danger.png';
import dinoColorImage from '../images/dino_color.png';
import dinoImage from '../images/dino.webp';

const Main = () => {
    const [meteors, setMeteors] = useState([]);
    const [filteredMeteors, setFilteredMeteors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sizeRange, setSizeRange] = useState([0, 1000]);
    const [distanceRange, setDistanceRange] = useState([0, 1000]);
    const [hazardFilter, setHazardFilter] = useState('Все');
    const [sortOrder, setSortOrder] = useState('A-Z');
    const [activeButtons, setActiveButtons] = useState({});
    const [history, setHistory] = useState([]);
    const [username, setUsername] = useState(null); // Состояние для имени пользователя

    // Функция для переключения сортировки
    const handleSortToggle = () => {
        setSortOrder(sortOrder === 'A-Z' ? 'Z-A' : 'A-Z');
    };

    // Функция для определения размера изображения
    const getImageSize = (size) => {
        if (size < 50) return 'small'; // Маленький метеорит
        if (size < 150) return 'medium'; // Средний метеорит
        return 'large'; // Большой метеорит
    };

    // Загрузка данных с API NASA
    useEffect(() => {
        const fetchMeteors = async () => {
            try {
                const response = await axios.get(
                    'https://api.nasa.gov/neo/rest/v1/feed?start_date=2015-09-07&end_date=2015-09-08&api_key=ElN1grRp9GLZYYg8pAerHc3aq8dLfPfmshKAr89I'
                );
                const data = Object.values(response.data.near_earth_objects).flat();
                const formattedData = data.map((meteor) => ({
                    name: meteor.name,
                    size: meteor.estimated_diameter.meters.estimated_diameter_max,
                    distance: meteor.close_approach_data[0].miss_distance.kilometers,
                    isHazardous: meteor.is_potentially_hazardous_asteroid,
                }));
                setMeteors(formattedData);
                setFilteredMeteors(formattedData);

                const minSize = Math.min(...formattedData.map((m) => m.size));
                const maxSize = Math.max(...formattedData.map((m) => m.size));
                const minDistance = Math.min(...formattedData.map((m) => parseFloat(m.distance)));
                const maxDistance = Math.max(...formattedData.map((m) => parseFloat(m.distance)));
                setSizeRange([minSize, maxSize]);
                setDistanceRange([minDistance, maxDistance]);
            } catch (error) {
                console.error('Ошибка при загрузке данных:', error);
            }
        };
        fetchMeteors();
    }, []);

    // Загрузка истории из файла history.txt
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
    }, []);

    // Обновление состояния кнопок на основе истории
    useEffect(() => {
        const updatedActiveButtons = {};
        filteredMeteors.forEach((meteor, index) => {
            const lastEntry = history
                .filter((entry) => entry.meteorName === meteor.name)
                .pop();
            if (lastEntry) {
                if (lastEntry.action === 'Помещён на уничтожение') {
                    updatedActiveButtons[index] = { destroyActive: false, cancelActive: true };
                } else if (lastEntry.action === 'Снят с уничтожения') {
                    updatedActiveButtons[index] = { destroyActive: true, cancelActive: false };
                }
            } else {
                updatedActiveButtons[index] = { destroyActive: true, cancelActive: false };
            }
        });
        setActiveButtons(updatedActiveButtons);
    }, [history, filteredMeteors]);

    // Обработчик нажатия на кнопку "На уничтожение"
    const handleDestroyClick = async (index) => {
        const meteorName = filteredMeteors[index].name;

        try {
            await axios.post('/destroy', { meteorName }); // Отправляем только название метеорита
            const response = await axios.get('/get_history');
            setHistory(response.data);
        } catch (error) {
            console.error('Ошибка при отправке запроса на уничтожение:', error);
        }
    };

// Обработчик нажатия на кнопку "Отмена"
    const handleCancelClick = async (index) => {
        const meteorName = filteredMeteors[index].name;

        try {
            await axios.post('/recovery', { meteorName }); // Отправляем только название метеорита
            const response = await axios.get('/get_history');
            setHistory(response.data);
        } catch (error) {
            console.error('Ошибка при отправке запроса на отмену:', error);
        }
    };

    // Фильтрация и сортировка данных
    useEffect(() => {
        let filtered = meteors.filter((meteor) => {
            const matchesSearch = meteor.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSize = meteor.size >= sizeRange[0] && meteor.size <= sizeRange[1];
            const matchesDistance =
                parseFloat(meteor.distance) >= distanceRange[0] && parseFloat(meteor.distance) <= distanceRange[1];
            const matchesHazard =
                hazardFilter === 'Все' ||
                (hazardFilter === 'Опасен' && meteor.isHazardous) ||
                (hazardFilter === 'Не опасен' && !meteor.isHazardous);
            return matchesSearch && matchesSize && matchesDistance && matchesHazard;
        });

        if (sortOrder === 'A-Z') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            filtered.sort((a, b) => b.name.localeCompare(a.name));
        }
        setFilteredMeteors(filtered);
    }, [searchTerm, sizeRange, distanceRange, hazardFilter, sortOrder, meteors]);

    return (
        <div className="main">
            <Header />
            <div className="filters">
                {/* Поле поиска */}
                <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {/* Фильтр по размеру */}
                <div className="filter">
                    <span>
                        <b>Размер</b>
                    </span>
                    <span>
                        <b>Мин:</b> {Math.round(sizeRange[0])}
                    </span>
                    <input
                        type="range"
                        min={Math.min(...meteors.map((m) => m.size))}
                        max={Math.max(...meteors.map((m) => m.size))}
                        value={sizeRange[0]}
                        onChange={(e) => setSizeRange([parseFloat(e.target.value), sizeRange[1]])}
                    />
                    <span>
                        <b>Макс:</b> {Math.round(sizeRange[1])}
                    </span>
                    <input
                        type="range"
                        min={Math.min(...meteors.map((m) => m.size))}
                        max={Math.max(...meteors.map((m) => m.size))}
                        value={sizeRange[1]}
                        onChange={(e) => setSizeRange([sizeRange[0], parseFloat(e.target.value)])}
                    />
                </div>
                {/* Фильтр по расстоянию */}
                <div className="filter">
                    <span>
                        <b>Расстояние</b>
                    </span>
                    <span>
                        <b>Мин:</b> {Math.round(distanceRange[0])}
                    </span>
                    <input
                        type="range"
                        min={Math.min(...meteors.map((m) => parseFloat(m.distance)))}
                        max={Math.max(...meteors.map((m) => parseFloat(m.distance)))}
                        value={distanceRange[0]}
                        onChange={(e) => setDistanceRange([parseFloat(e.target.value), distanceRange[1]])}
                    />
                    <span>
                        <b>Макс:</b> {Math.round(distanceRange[1])}
                    </span>
                    <input
                        type="range"
                        min={Math.min(...meteors.map((m) => parseFloat(m.distance)))}
                        max={Math.max(...meteors.map((m) => parseFloat(m.distance)))}
                        value={distanceRange[1]}
                        onChange={(e) => setDistanceRange([distanceRange[0], parseFloat(e.target.value)])}
                    />
                </div>
                {/* Выпадающий список */}
                <select value={hazardFilter} onChange={(e) => setHazardFilter(e.target.value)}>
                    <option value="Все">Все</option>
                    <option value="Опасен">Опасен</option>
                    <option value="Не опасен">Не опасен</option>
                </select>
                {/* Кнопка сортировки */}
                <button onClick={handleSortToggle}>
                    Сортировать: {sortOrder === 'A-Z' ? 'A-Z' : 'Z-A'}
                </button>
            </div>
            {/* Блок витрины */}
            <div className="showcase-container">
                <div className="showcase">
                    {filteredMeteors.map((meteor, index) => {
                        const imageSize = getImageSize(meteor.size);
                        const imagePath = meteor.isHazardous ? dangerImage : notDangerImage;

                        const { destroyActive = true, cancelActive = false } = activeButtons[index] || {};

                        const isLargeOrHazardous = meteor.size >= 150 || meteor.isHazardous;
                        const dinoIcon = isLargeOrHazardous && destroyActive ? dinoImage : dinoColorImage;

                        return (
                            <div key={index} className="card">
                                {/* Секция для изображения */}
                                <div className="image-section">
                                    <img
                                        src={imagePath}
                                        alt={meteor.isHazardous ? 'Опасный метеорит' : 'Неопасный метеорит'}
                                        className={`meteor-image ${imageSize}`}
                                    />
                                    {/* Иконка динозавра */}
                                    <img
                                        src={dinoIcon}
                                        alt="Динозавр"
                                        className="dino-icon"
                                    />
                                </div>
                                {/* Секция для текста */}
                                <div className="text-section">
                                    <h3>{meteor.name}</h3>
                                    <p>Размер: {meteor.size.toFixed(2)} м</p>
                                    <p>
                                        Расстояние до Земли: <br /> {parseFloat(meteor.distance).toFixed(2)} км
                                    </p>
                                    <p>Опасность: {meteor.isHazardous ? 'Опасен' : 'Не опасен'}</p>
                                </div>
                                {/* Секция для кнопок */}
                                <div className="button-section">
                                    <button
                                        style={{
                                            backgroundColor: destroyActive ? '#ff4d4d' : '#7c8887',
                                            cursor: destroyActive ? 'pointer' : 'not-allowed',
                                        }}
                                        onClick={() => destroyActive && handleDestroyClick(index)}
                                    >
                                        На уничтожение
                                    </button>
                                    <button
                                        style={{
                                            marginTop: '10px',
                                            backgroundColor: cancelActive ? '#1a9dff' : '#7c8887',
                                            cursor: cancelActive ? 'pointer' : 'not-allowed',
                                        }}
                                        onClick={() => cancelActive && handleCancelClick(index)}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Main;