import React, { useState, useEffect } from 'react';
import WeeklyMenu from '../components/WeeklyMenu';
import PaymentModal from '../components/PaymentModal';
import AllergiesModal from '../components/AllergiesModal';
import "../styles/HomeUser.css";
import ReviewModal from '../components/ReviewModal';
import { ACCESS_TOKEN } from "../constants";

function HomeUser() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const username = user.username;

    const [showAllergiesModal, setShowAllergiesModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviews, setReviews] = useState([]);

    const handleSubscriptionPaymentSuccess = (amount) => {
        console.log(`Абонемент оплачен: ${amount} руб.`);
    };


    useEffect(() => {
        const loadReviews = async () => {
            try {
                const token = localStorage.getItem("access");
                if (!token) return;

                const res = await fetch("/api/user/reviews/", {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setReviews(data);
                }
            } catch (err) {
                console.error("Ошибка загрузки отзывов:", err);
            }
        };

        loadReviews();
    }, []);


    const handleSaveAllergies = async (newAllergies) => {
        try {
            const token = localStorage.getItem("access");
            const res = await fetch("/api/user/me/", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ allergies: newAllergies })
            });

            if (!res.ok) throw new Error("Не удалось сохранить");

            const updatedUser = { ...user, allergies: newAllergies };
            localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendReview = async (reviewData) => {
        try {
            const token = localStorage.getItem("access");
            const today = new Date().toISOString().split('T')[0]; // текущая дата

            const res = await fetch("/api/reviews/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: today,
                    ...reviewData
                })
            });

            if (!res.ok) throw new Error("Не удалось отправить отзыв");

            alert("Отзыв успешно отправлен!");
        } catch (err) {
            console.error(err);
            alert("Ошибка при отправке отзыва");
        }
    };

    
    return (
        <div className="home-user">
            <header className="user-header">
                <div className="user-info">
                    <h1>Добро пожаловать! {username}</h1>
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

            <div className="dashboard-grid">
                <div className="main-content">
                    <WeeklyMenu />
                </div>

                <aside className="sidebar">
                    {/* Абонемент */}
                    <div className="sidebar-card">
                        <h2 className="meal-header">Купить абонемент</h2>
                        <h2>Цена: 6000.00 ₽</h2>
                        <button 
                            className="sidebar-btn secondary"
                            onClick={() => setShowSubscriptionModal(true)}
                        >
                            купить абонемент
                        </button>
                    </div>

                    {/* Аллергии */}
                    <div className="sidebar-card">
                        <h3>Ваши пищевые аллергии</h3>
                        <p>{user.allergies || "не указано"}</p>
                        <button 
                            className="sidebar-btn secondary"
                            onClick={() => setShowAllergiesModal(true)}
                        >
                            Изменить
                        </button>
                    </div>

                    {/* Отзывы */}
                    <div className="sidebar-card">
                        <h2 className="meal-header">Ваши отзывы</h2>

                        {/* Список отзывов */}
                        {reviews.length > 0 ? (
                            <div className="reviews-list">
                                {reviews.slice(0, 3).map((rev, idx) => (
                                    <div key={idx} className="review-item">
                                        <div className="review-header">
                                            <span className="meal-type">
                                                {rev.meal_type === 'breakfast' ? 'Завтрак' : 'Обед'}
                                            </span>
                                            <span className="rating">⭐ {rev.rating}</span>
                                        </div>
                                        <p className="review-comment">{rev.comment}</p>
                                        <small className="review-date">
                                            {new Date(rev.date).toLocaleDateString('ru-RU')}
                                        </small>
                                    </div>
                                ))}
                                {reviews.length > 3 && (
                                    <p className="see-more">и ещё {reviews.length - 3} отзывов</p>
                                )}
                            </div>
                        ) : (
                            <p className="no-reviews">У вас пока нет отзывов</p>
                        )}

                        <button 
                            className="sidebar-btn secondary"
                            onClick={() => setShowReviewModal(true)}
                        >
                            Оставить отзыв
                        </button>
                    </div>
                </aside>
            </div>



            <footer className="user-footer">
                <p>Школьная столовая 2026 </p>
            </footer>



            {/* Оплата Абонемента */}
            <PaymentModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                selectedDay={new Date()} // можно передать любую дату или null
                price={6000}
                onPaymentSuccess={handleSubscriptionPaymentSuccess}
            />


            <AllergiesModal
                isOpen={showAllergiesModal}
                onClose={() => setShowAllergiesModal(false)}
                currentAllergies={user.allergies}
                onSave={handleSaveAllergies}
            />

            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onSend={handleSendReview}
            />
        </div>
    );
}

export default HomeUser;