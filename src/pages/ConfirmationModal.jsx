import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="confirmation-modal">
            <div className="confirmation-modal-content">
                <p>{message}</p>
                <div className="confirmation-modal-buttons">
                    <button onClick={onConfirm}>Да</button>
                    <button onClick={onCancel}>Нет</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
