import React from 'react';
import './Loading.css'; // Подключите стили для анимации
import ld_img from '../images/loading.gif';
const LoadingSpinner = () => {
    return (
        <div id="loading" className="loading-spinner">
            <img src={ld_img} alt="Loading"/>
            <div className="spinner"></div>
        </div>
    );
};

export default LoadingSpinner;
