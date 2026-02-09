import React, { useState, useEffect } from 'react';
import '../styles/CookDashboard.css';

const CookDashboard = () => {
    const [todayPaidBreakfast, setTodayPaidBreakfast] = useState([]);
    const [todayPaidLunch, setTodayPaidLunch] = useState([]);
    const [newRequest, setNewRequest] = useState({ product_name: '', quantity: '', unit: '' });
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('access');
                if (!token) throw new Error('Токен не найден');

                // Загрузка заявок
                const reqRes = await fetch('/api/cook/dashboard/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!reqRes.ok) throw new Error('Ошибка загрузки заявок');
                const reqData = await reqRes.json();
                setRequests(reqData.purchase_requests || []);

                // Загрузка оплативших (только не выданных!)
                const bfRes = await fetch(`/api/paid-students/?date=${today}&meal_type=breakfast`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const lunchRes = await fetch(`/api/paid-students/?date=${today}&meal_type=lunch`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!bfRes.ok || !lunchRes.ok) throw new Error('Ошибка загрузки списков');

                setTodayPaidBreakfast(await bfRes.json());
                setTodayPaidLunch(await lunchRes.json());

            } catch (err) {
                console.error('Ошибка загрузки:', err);
                setError(err.message || 'Неизвестная ошибка');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [today]);

    const handleIssueMealForUser = async (userId, mealType) => {
        try {
            const token = localStorage.getItem('access');
            const res = await fetch('/api/cook/issue-meal-for-user/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: userId, meal_type: mealType, date: today })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Не удалось выдать');
            }

            // Обновляем локальный список
            if (mealType === 'breakfast') {
                setTodayPaidBreakfast(prev => prev.filter(u => u.id !== userId));
            } else {
                setTodayPaidLunch(prev => prev.filter(u => u.id !== userId));
            }

            alert('Выдано успешно!');
        } catch (err) {
            console.error(err);
            alert(`Ошибка: ${err.message}`);
        }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access');
            const res = await fetch('/api/cook/purchase-requests/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newRequest)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Не удалось создать заявку');
            }

            setNewRequest({ product_name: '', quantity: '', unit: '' });
            alert('Заявка создана!');

            // Обновить заявки (опционально — можно перезагрузить dashboard)
            const updatedRes = await fetch('/api/cook/dashboard/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await updatedRes.json();
            setRequests(data.purchase_requests || []);
        } catch (err) {
            console.error(err);
            alert(`Ошибка: ${err.message}`);
        }
    };

    if (isLoading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="cook-dashboard">
            <header className="user-header">
                <div className="user-info">
                    <h1>Панель повара</h1>
                </div>
                <button 
                    className="logout-btn"
                    onClick={() => {
                        // Очистка токенов и данных пользователя
                        localStorage.removeItem("access");
                        localStorage.removeItem("refresh");
                        localStorage.removeItem("user");
                        // Перенаправление на страницу входа
                        window.location.href = "/login";
                    }}
                >
                    Выйти
                </button>
            </header>
            

            {/* СЕГОДНЯ — только не выданные ученики */}
            <section className="today-section">
                <h2>Сегодня ({today})</h2>

                <div className="meals-today">
                    {/* Завтрак */}
                    <div className="meal-list">
                        <h3>Оплатили завтрак ({todayPaidBreakfast.length})</h3>
                        {todayPaidBreakfast.length === 0 ? (
                            <p className="empty">Нет учеников, ожидающих завтрак</p>
                        ) : (
                            <ul>
                                {todayPaidBreakfast.map(user => (
                                    <li key={user.id} className="student-item">
                                        <span>{user.first_name || user.username} {user.last_name || ''}</span>
                                        <button
                                            className="issue-btn"
                                            onClick={() => handleIssueMealForUser(user.id, 'breakfast')}
                                        >
                                            Выдать
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Обед */}
                    <div className="meal-list">
                        <h3>Оплатили обед ({todayPaidLunch.length})</h3>
                        {todayPaidLunch.length === 0 ? (
                            <p className="empty">Нет учеников, ожидающих обед</p>
                        ) : (
                            <ul>
                                {todayPaidLunch.map(user => (
                                    <li key={user.id} className="student-item">
                                        <span>{user.first_name || user.username} {user.last_name || ''}</span>
                                        <button
                                            className="issue-btn"
                                            onClick={() => handleIssueMealForUser(user.id, 'lunch')}
                                        >
                                            Выдать
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </section>

            {/* Заявки на закупку */}
            <section className="requests-section">
                <h2>Заявки на закупку</h2>

                <form onSubmit={handleCreateRequest} className="request-form">
                    <input
                        type="text"
                        placeholder="Название продукта"
                        value={newRequest.product_name}
                        onChange={(e) => setNewRequest({...newRequest, product_name: e.target.value})}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Количество"
                        value={newRequest.quantity}
                        onChange={(e) => setNewRequest({...newRequest, quantity: e.target.value})}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Ед. изм. (кг, шт, л)"
                        value={newRequest.unit}
                        onChange={(e) => setNewRequest({...newRequest, unit: e.target.value})}
                        required
                    />
                    <button type="submit">Создать заявку</button>
                </form>

                <div className="requests-list">
                    {requests.length === 0 ? (
                        <p className="empty">Заявок пока нет</p>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="request-item">
                                <strong>{req.product_name}</strong> — {req.quantity} {req.unit}
                                <span className={`status ${req.status || 'pending'}`}>
                                    {req.status || 'ожидает'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default CookDashboard;