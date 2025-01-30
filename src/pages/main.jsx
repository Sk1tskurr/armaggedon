import React, { useEffect, useState } from 'react';
import { Header } from '../header/Header';
import axios from 'axios';
import './Main.css';
import dangerImage from '../images/danger.png'; // Импорт изображений
import notDangerImage from '../images/not_danger.png';
import dinoColorImage from '../images/dino_color.png'; // Импорт цветной иконки динозавра
import dinoImage from '../images/dino.webp'; // Импорт черно-белой иконки динозавра

const Main = () => {
    const [meteors, setMeteors] = useState([]);
    const [filteredMeteors, setFilteredMeteors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sizeRange, setSizeRange] = useState([0, 1000]);
    const [distanceRange, setDistanceRange] = useState([0, 1000]);
    const [hazardFilter, setHazardFilter] = useState('Все');
    const [sortOrder, setSortOrder] = useState('A-Z');

    // Состояние для отслеживания активности кнопок в карточках
    const [activeButtons, setActiveButtons] = useState({});

    useEffect(() => {
        // Загрузка данных с API NASA
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

                // Установка начальных значений для ползунков
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

    useEffect(() => {
        // Фильтрация и сортировка данных
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

    const handleSortToggle = () => {
        setSortOrder(sortOrder === 'A-Z' ? 'Z-A' : 'A-Z');
    };

    // Определение размера изображения
    const getImageSize = (size) => {
        if (size < 50) return 'small'; // Маленький метеорит
        if (size < 150) return 'medium'; // Средний метеорит
        return 'large'; // Большой метеорит
    };

    // Обработчик нажатия на кнопку "На уничтожение"
    const handleDestroyClick = (index) => {
        setActiveButtons((prev) => ({
            ...prev,
            [index]: { destroyActive: false, cancelActive: true },
        }));
    };

    // Обработчик нажатия на кнопку "Отмена"
    const handleCancelClick = (index) => {
        setActiveButtons((prev) => ({
            ...prev,
            [index]: { destroyActive: true, cancelActive: false },
        }));
    };

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

                        // Получаем состояние кнопок для текущей карточки
                        const { destroyActive = true, cancelActive = false } = activeButtons[index] || {};

                        // Логика выбора иконки динозавра
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