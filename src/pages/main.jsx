import React, { useEffect, useState } from 'react';
import { Header } from '../header/Header';
import axios from 'axios';
import './Main.css';
import dangerImage from '../images/danger.png'; // Импорт изображений
import notDangerImage from '../images/not_danger.png';

const Main = () => {
    const [meteors, setMeteors] = useState([]);
    const [filteredMeteors, setFilteredMeteors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sizeRange, setSizeRange] = useState([0, 1000]);
    const [distanceRange, setDistanceRange] = useState([0, 1000]);
    const [hazardFilter, setHazardFilter] = useState('Все');
    const [sortOrder, setSortOrder] = useState('A-Z');

    useEffect(() => {
        // Загрузка данных с API NASA
        const fetchMeteors = async () => {
            try {
                const response = await axios.get(
                    'https://api.nasa.gov/neo/rest/v1/feed?start_date=2015-09-07&end_date=2015-09-08&api_key=DEMO_KEY'
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
                    <span>Размер</span>
                    <div>
                        <span>Мин: {sizeRange[0]}</span>
                        <span style={{ marginLeft: '30px' }}>Макс: {sizeRange[1]}</span>
                    </div>
                    <input
                        type="range"
                        min={Math.min(...meteors.map((m) => m.size))}
                        max={Math.max(...meteors.map((m) => m.size))}
                        value={sizeRange[0]}
                        onChange={(e) => setSizeRange([parseFloat(e.target.value), sizeRange[1]])}
                    />
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
                    <span>Расстояние</span>
                    <div>
                        <span>Мин: {distanceRange[0]}</span>
                        <span style={{ marginLeft: '30px' }}>Макс: {distanceRange[1]}</span>
                    </div>
                    <input
                        type="range"
                        min={Math.min(...meteors.map((m) => parseFloat(m.distance)))}
                        max={Math.max(...meteors.map((m) => parseFloat(m.distance)))}
                        value={distanceRange[0]}
                        onChange={(e) => setDistanceRange([parseFloat(e.target.value), distanceRange[1]])}
                    />
                    <input
                        type="range"
                        min={Math.min(...meteors.map((m) => parseFloat(m.distance)))}
                        max={Math.max(...meteors.map((m) => parseFloat(m.distance)))}
                        value={distanceRange[1]}
                        onChange={(e) => setDistanceRange([distanceRange[0], parseFloat(e.target.value)])}
                    />
                </div>

                {/* Фильтр по опасности */}
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

                        return (
                            <div key={index} className="card">
                                <img
                                    src={imagePath}
                                    alt={meteor.isHazardous ? 'Опасный метеорит' : 'Неопасный метеорит'}
                                    className={`meteor-image ${imageSize}`}
                                />
                                <h3>{meteor.name}</h3>
                                <p>Размер: {meteor.size.toFixed(2)} м</p>
                                <p>Расстояние до Земли: {parseFloat(meteor.distance).toFixed(2)} км</p>
                                <p>Опасность: {meteor.isHazardous ? 'Опасен' : 'Не опасен'}</p>
                                <button>Отправить на уничтожение</button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Main;