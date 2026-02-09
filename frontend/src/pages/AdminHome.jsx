// frontend/src/pages/AdminHome.jsx
import React, { useState, useEffect } from 'react';
import '../styles/AdminHome.css';

const AdminHome = () => {
    const [stats, setStats] = useState(null);
    const [purchaseRequests, setPurchaseRequests] = useState([]);
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Загрузка всех данных при монтировании
    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('access');
                if (!token) throw new Error('Токен не найден');

                const headers = { 'Authorization': `Bearer ${token}` };

                // 1. Статистика
                const statsRes = await fetch('/api/admin/stats/', { headers });
                if (!statsRes.ok) throw new Error('Ошибка загрузки статистики');
                const statsData = await statsRes.json();
                setStats(statsData);

                // 2. Заявки на закупку
                const reqRes = await fetch('/api/admin/purchase-requests/', { headers });
                if (!reqRes.ok) throw new Error('Ошибка загрузки заявок');
                const reqData = await reqRes.json();
                setPurchaseRequests(reqData);

                // 3. Отчёты (например, за последние 7 дней)
                const today = new Date();
                const dates = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    dates.push(d.toISOString().split('T')[0]);
                }

                const reportPromises = dates.map(date =>
                    fetch(`/api/admin/reports/daily/?date=${date}`, { headers })
                        .then(res => res.json())
                        .catch(() => ({ date, error: true }))
                );

                const reportsData = await Promise.all(reportPromises);
                setReports(reportsData.filter(r => !r.error));

            } catch (err) {
                console.error('Ошибка загрузки:', err);
                setError(err.message || 'Неизвестная ошибка');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Согласование заявки
    const handleApproveRequest = async (requestId, approve = true) => {
        try {
            const token = localStorage.getItem('access');
            const res = await fetch(`/api/admin/approve-request/${requestId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ approved: approve })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Не удалось обновить заявку');
            }

            // Обновляем список локально
            setPurchaseRequests(prev =>
                prev.map(req =>
                    req.id === requestId ? { ...req, status: approve ? 'approved' : 'rejected' } : req
                )
            );

            alert(approve ? 'Заявка одобрена!' : 'Заявка отклонена.');
        } catch (err) {
            console.error(err);
            alert(`Ошибка: ${err.message}`);
        }
    };

    // Генерация PDF-отчёта (пример — можно заменить на реальный экспорт)
    const handleExportReport = () => {
        alert('Функция экспорта отчёта будет реализована позже.\nДанные уже доступны в таблице.');
    };

    if (isLoading) return <div className="loading">Загрузка данных...</div>;
    if (error) return <div className="error">Ошибка: {error}</div>;

    return (
        <div className="admin-home">
                <div className="user-info">
                    <h1>Панель администратора</h1>
                </div>
                <button 
                    className="logout-btn"
                    onClick={() => {
                        window.location.href = "/login";
                    }}
                >
                    Выйти
                </button>

            {/* Статистика */}
            <section className="stats-section">
                <h2>Статистика</h2>
                {stats && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h2>Оплат сегодня</h2>
                            <p className="value">{stats.today_payments}</p>
                        </div>
                        <div className="stat-card">
                            <h2>Абонементов активно</h2>
                            <p className="value">{stats.active_subscriptions}</p>
                        </div>
                        <div className="stat-card">
                            <h2>Выдано комплектов</h2>
                            <p className="value">{stats.meals_issued_today}</p>
                        </div>
                    </div>
                )}
            </section>

            {/* Заявки на закупку */}
            <section className="requests-section">
                <h2>Заявки на закупку</h2>
                {purchaseRequests.length === 0 ? (
                    <p>Нет новых заявок.</p>
                ) : (
                    <table className="requests-table">
                        <thead>
                            <tr>
                                <th>Продукт</th>
                                <th>Количество</th>
                                <th>Ед. изм.</th>
                                <th>Автор</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseRequests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.product_name}</td>
                                    <td>{req.quantity}</td>
                                    <td>{req.unit}</td>
                                    <td>{req.created_by_username}</td>
                                    <td>
                                        <span className={`status ${req.status}`}>
                                            {req.status === 'pending' ? 'Ожидает' :
                                             req.status === 'approved' ? 'Одобрено' : 'Отклонено'}
                                        </span>
                                    </td>
                                    <td>
                                        {req.status === 'pending' ? (
                                            <>
                                                <button
                                                    className="btn-approve"
                                                    onClick={() => handleApproveRequest(req.id, true)}
                                                >
                                                    Одобрить
                                                </button>
                                                <button
                                                    className="btn-reject"
                                                    onClick={() => handleApproveRequest(req.id, false)}
                                                >
                                                    Отклонить
                                                </button>
                                            </>
                                        ) : (
                                            <span>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* Отчёты */}
            <section className="reports-section">
                <div className="report-header">
                    <h2>Отчёты по питанию и затратам</h2>
                </div>

                {reports.length === 0 ? (
                    <p>Нет данных для отчёта.</p>
                ) : (
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Завтраки</th>
                                <th>Обеды</th>
                                <th>Абонементы</th>
                                <th>Разовые оплаты</th>
                                <th>Выдано</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(rep => (
                                <tr key={rep.date}>
                                    <td>{rep.date}</td>
                                    <td>{rep.breakfast_count}</td>
                                    <td>{rep.lunch_count}</td>
                                    <td>{rep.subscriptions_used}</td>
                                    <td>{rep.one_time_payments}</td>
                                    <td>{rep.meals_issued}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
};

export default AdminHome;