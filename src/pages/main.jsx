import React, { useEffect, useState } from 'react';
import { Header } from '../header/Header';
import axios from 'axios';
import './Main.css';
import Card from '../component/card';

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

    // Загрузка данных с API NASA
    useEffect(() => {
        const fetchMeteors = async () => {
            try {
                const response = await axios.get(
                    'https://api.nasa.gov/neo/rest/v1/feed?start_date=2001-01-01&end_date=2001-01-07&api_key=ElN1grRp9GLZYYg8pAerHc3aq8dLfPfmshKAr89I'
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

    // Загрузка истории
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

    // Обновление состояния кнопок
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

    // Фильтрация и сортировка
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

    // Обработчики кнопок
    const handleDestroyClick = async (index) => {
        const meteorName = filteredMeteors[index].name;
        try {
            await axios.post('/destroy', { meteorName });
            const response = await axios.get('/get_history');
            setHistory(response.data);
        } catch (error) {
            console.error('Ошибка при отправке запроса на уничтожение:', error);
        }
    };

    const handleCancelClick = async (index) => {
        const meteorName = filteredMeteors[index].name;
        try {
            await axios.post('/recovery', { meteorName });
            const response = await axios.get('/get_history');
            setHistory(response.data);
        } catch (error) {
            console.error('Ошибка при отправке запроса на отмену:', error);
        }
    };

    return (
        <div className="main">
            <Header/>
            <div className="filters">
                <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="filter">
                    <span>Размер: Мин {Math.round(sizeRange[0])} м</span>
                    <input
                        type="range"
                        min={Math.min(...meteors.map((m) => m.size))}
                        max={Math.max(...meteors.map((m) => m.size))}
                        value={sizeRange[0]}
                        onChange={(e) => setSizeRange([parseFloat(e.target.value), sizeRange[1]])}
                    />
                    <span>Макс {Math.round(sizeRange[1])} м</span>
                    <input
                        type="range"
                        min={Math.min(...meteors.map((m) => m.size))}
                        max={Math.max(...meteors.map((m) => m.size))}
                        value={sizeRange[1]}
                        onChange={(e) => setSizeRange([sizeRange[0], parseFloat(e.target.value)])}
                    />
                </div>
                <div className="filter">
                    <span>Расстояние: Мин {Math.round(distanceRange[0])} км</span>
                    <input
                        type="range"
                        min={Math.min(...meteors.map((m) => parseFloat(m.distance)))}
                        max={Math.max(...meteors.map((m) => parseFloat(m.distance)))}
                        value={distanceRange[0]}
                        onChange={(e) => setDistanceRange([parseFloat(e.target.value), distanceRange[1]])}
                    />
                    <span>Макс {Math.round(distanceRange[1])} км</span>
                    <input
                        type="range"
                        min={Math.min(...meteors.map((m) => parseFloat(m.distance)))}
                        max={Math.max(...meteors.map((m) => parseFloat(m.distance)))}
                        value={distanceRange[1]}
                        onChange={(e) => setDistanceRange([distanceRange[0], parseFloat(e.target.value)])}
                    />
                </div>
                <select value={hazardFilter} onChange={(e) => setHazardFilter(e.target.value)}>
                    <option value="Все">Все</option>
                    <option value="Опасен">Опасен</option>
                    <option value="Не опасен">Не опасен</option>
                </select>
                <button onClick={() => setSortOrder(sortOrder === 'A-Z' ? 'Z-A' : 'A-Z')}>
                    Сортировать: {sortOrder === 'A-Z' ? 'A-Z' : 'Z-A'}
                </button>
            </div>
            <div className="showcase-container">
                <div className="showcase">
                    {filteredMeteors.map((meteor, index) => (
                        <Card
                            key={index}
                            meteor={meteor}
                            onDestroyClick={() => handleDestroyClick(index)}
                            onCancelClick={() => handleCancelClick(index)}
                            destroyActive={activeButtons[index]?.destroyActive || false}
                            cancelActive={activeButtons[index]?.cancelActive || false}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Main;