import React, { useState } from 'react';
import '../styles/PaymentModal.css';
import { ACCESS_TOKEN } from '../constants';

const PaymentModal = ({ 
    isOpen, 
    onClose, 
    selectedDay, 
    price, 
    mealType,        
    onPaymentSuccess 
}) => {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCVC, setCardCVC] = useState('');
    const [isPaying, setIsPaying] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    if (!isOpen) return null;

    // номер карты
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        
        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    // срок действия корты
    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    const handleCardNumberChange = (e) => {
        setCardNumber(formatCardNumber(e.target.value));
    };

    const handleExpiryChange = (e) => {
        setCardExpiry(formatExpiry(e.target.value));
    };

    const handleCVCChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 3) {
            setCardCVC(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (paymentMethod === 'card') {
            // валидация карты
            if (cardNumber.replace(/\s/g, '').length !== 16) {
                alert('Введите корректный номер карты');
                return;
            }
            
            if (!cardExpiry.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)) {
                alert('Введите корректную дату');
                return;
            }
            
            if (cardCVC.length !== 3) {
                alert('Введите корректный CVC код');
                return;
            }
        }

        setIsPaying(true);
        
        // типа оплата
        try {
            const token = localStorage.getItem(ACCESS_TOKEN);
            if (!token) throw new Error("Токен не найден");

            if (price === 6000) {
                // Абонемент
                const subRes = await fetch('/api/buy-subscription/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        start_date: selectedDay.toISOString().split('T')[0]
                    })
                });

                if (!subRes.ok) throw new Error(`HTTP ${subRes.status}`);

                // Обновить localStorage
                const subs = JSON.parse(localStorage.getItem('subscriptions') || '[]');
                const endDate = new Date(selectedDay);
                endDate.setDate(endDate.getDate() + 30);
                subs.push({
                    start_date: selectedDay.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0]
                });
                localStorage.setItem('subscriptions', JSON.stringify(subs));

            } else {
                // Разовая оплата
                const mealRes = await fetch('/api/pay-meal/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        date: selectedDay.toISOString().split('T')[0],
                        meal_type: mealType
                    })
                });

                if (!mealRes.ok) throw new Error(`HTTP ${mealRes.status}`);

                // Сохранить в localStorage
                const payments = JSON.parse(localStorage.getItem('mealPayments') || '[]');
                payments.push({ date: selectedDay.toISOString().split('T')[0], meal_type: mealType, amount: price });
                localStorage.setItem('mealPayments', JSON.stringify(payments));
            }

            setPaymentSuccess(true);

            // Через 4 секунды закрыть
            setTimeout(() => {
                setPaymentSuccess(false);
                onClose();
                onPaymentSuccess?.(price);
            }, 4000);

        } catch (err) {
            console.error(err);
            alert("Ошибка: " + (err.message || "Неизвестная ошибка"));
            setIsPaying(false);
        }
    };

    const formatDate = (date) => {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return date.toLocaleDateString('ru-RU', options);
    };

    const handleClose = () => {
        if (!isPaying) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="payment-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={handleClose} disabled={isPaying}>
                    ×
                </button>
                
                {!paymentSuccess ? (
                    <>
                        <h2>Оплата питания</h2>
                        <p className="payment-info">
                            {formatDate(selectedDay)} • {price} ₽
                        </p>

                        <form onSubmit={handleSubmit} className="payment-form">
                            <div className="payment-methods">
                                <label>
                                    <input
                                        type="radio"
                                        value="card"
                                        checked={paymentMethod === 'card'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        disabled={isPaying}
                                    />
                                    Банковская карта
                                </label>
                            </div>

                            {paymentMethod === 'card' && (
                                <div className="card-details">
                                    <input
                                        type="text"
                                        placeholder="Номер карты"
                                        value={cardNumber}
                                        onChange={handleCardNumberChange}
                                        className="card-input"
                                        maxLength="19"
                                        disabled={isPaying}
                                        required
                                    />
                                    <div className="card-row">
                                        <input
                                            type="text"
                                            placeholder="ММ/ГГ"
                                            value={cardExpiry}
                                            onChange={handleExpiryChange}
                                            className="card-input small"
                                            maxLength="5"
                                            disabled={isPaying}
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="CVC"
                                            value={cardCVC}
                                            onChange={handleCVCChange}
                                            className="card-input small"
                                            maxLength="3"
                                            disabled={isPaying}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className="pay-btn"
                                disabled={isPaying}
                            >
                                {isPaying ? 'Обработка платежа...' : `Оплатить ${price} ₽`}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="success-message">
                        <div className="success-icon">✓</div>
                        <h2>Оплата успешно завершена!</h2>
                        <p>Питание на {formatDate(selectedDay)} оплачено.</p>
                        <p className="success-amount">{price} ₽</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;
