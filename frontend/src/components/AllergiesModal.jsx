import React, { useState } from 'react';
import '../styles/AllergiesModal.css';

const AllergiesModal = ({ isOpen, onClose, currentAllergies, onSave }) => {
    const [allergies, setAllergies] = useState(currentAllergies || '');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(allergies.trim());
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="allergies-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>
                <h2>Пищевые аллергии</h2>
                <p className="modal-info">Напишите продукты, на которые у вас аллергия (через запятую)</p>
                
                <form onSubmit={handleSubmit} className="allergies-form">
                    <textarea
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        placeholder="Пример: молоко, яйца, орехи и т.д."
                        className="allergies-input"
                        rows="4"
                    />
                    
                    <div className="modal-buttons">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="save-btn">
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AllergiesModal;