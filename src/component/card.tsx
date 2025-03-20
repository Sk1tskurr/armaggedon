import React from 'react';
import './card.css';
import dangerImage from '../images/danger.png';
import notDangerImage from '../images/not_danger.png';
import dinoColorImage from '../images/dino_pink.webp';
import dinoImage from "../images/dino.webp";

interface Meteor {
    name: string;
    size: number;
    distance: string;
    isHazardous: boolean;
}

interface CardProps {
    meteor: Meteor;
    onDestroyClick: () => void;
    onCancelClick: () => void;
    destroyActive: boolean;
    cancelActive: boolean;
}

const Card: React.FC<CardProps> = ({ meteor, onDestroyClick, onCancelClick, destroyActive, cancelActive }) => {
    const getImageSize = (size: number) => {
        if (size < 500) return 'small';
        if (size < 1000) return 'medium';
        return 'large';
    };

    const imageSize = getImageSize(meteor.size);
    const imagePath = meteor.isHazardous ? dangerImage : notDangerImage;
    const isLargeOrHazardous = meteor.size >= 150 || meteor.isHazardous;
    const dinoIcon = isLargeOrHazardous && destroyActive ? dinoImage : dinoColorImage;

    return (
        <div className="card">
            <div className="image-section">
                <img
                    src={imagePath}
                    alt={meteor.isHazardous ? 'Опасный метеорит' : 'Неопасный метеорит'}
                    className={`meteor-image ${imageSize}`}
                />
                <img src={dinoIcon} alt="Динозавр" className="dino-icon" />
            </div>
            <div className="text-section">
                <h3>{meteor.name}</h3>
                <p>Размер: {meteor.size.toFixed(2)} м</p>
                <p>Расстояние до Земли: {parseFloat(meteor.distance).toFixed(2)} км</p>
                <p>Опасность: {meteor.isHazardous ? 'Опасен' : 'Не опасен'}</p>
            </div>
            <div className="button-section">
                <button
                    style={{
                        backgroundColor: destroyActive ? '#ff4d4d' : '#7c8887',
                        cursor: destroyActive ? 'pointer' : 'not-allowed',
                    }}
                    onClick={onDestroyClick}
                    disabled={!destroyActive}
                >
                    На уничтожение
                </button>
                <button
                    style={{
                        marginTop: '10px',
                        backgroundColor: cancelActive ? '#1a9dff' : '#7c8887',
                        cursor: cancelActive ? 'pointer' : 'not-allowed',
                    }}
                    onClick={onCancelClick}
                    disabled={!cancelActive}
                >
                    Отмена
                </button>
            </div>
        </div>
    );
};

export default Card;