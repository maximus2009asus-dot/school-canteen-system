// frontend/src/components/ReviewModal.jsx
import React, { useState } from 'react';
import '../styles/ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, onSend }) => {
    const [mealType, setMealType] = useState('breakfast');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!comment.trim()) {
            alert('Пожалуйста, напишите отзыв.');
            return;
        }
        onSend({ meal_type: mealType, rating, comment });
        setComment('');
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Оставить отзыв</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Тип приёма пищи:</label>
                        <select
                            value={mealType}
                            onChange={(e) => setMealType(e.target.value)}
                        >
                            <option value="breakfast">Завтрак</option>
                            <option value="lunch">Обед</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Оценка (1–5):</label>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            value={rating}
                            onChange={(e) => setRating(Math.min(5, Math.max(1, Number(e.target.value))))}
                        />
                    </div>

                    <div className="form-group">
                        <label>Ваш отзыв:</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Расскажите, что вам понравилось или не понравилось..."
                            rows="4"
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="btn-primary">Отправить</button>
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;