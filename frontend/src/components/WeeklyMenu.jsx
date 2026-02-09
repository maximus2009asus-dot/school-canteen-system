import React, { useState, useEffect } from 'react';
import '../styles/WeeklyMenu.css';
import PaymentModal from './PaymentModal';

const WeeklyMenu = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(new Date());
    const [weeklyMenu, setWeeklyMenu] = useState([]);
    const [showBreakfastDetails, setShowBreakfastDetails] = useState(null);
    const [showLunchDetails, setShowLunchDetails] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedDayForPayment, setSelectedDayForPayment] = useState(new Date());
    const [selectedPrice, setSelectedPrice] = useState(0);
    const [selectedMealType, setSelectedMealType] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const shortDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    // Загрузка меню
    useEffect(() => {
        const loadWeeklyMenu = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/menu/weekly/');
                if (!response.ok) throw new Error('Ошибка загрузки меню');
                const menuData = await response.json();

                // Найти понедельник текущей недели
                const monday = new Date(currentDate);
                monday.setDate(currentDate.getDate() - currentDate.getDay() + 1); // getDay()=0→Вс, 1→Пн → +1 чтобы получить Пн

                const weekDays = [];
                for (let i = 0; i < 7; i++) {
                    const date = new Date(monday);
                    date.setDate(monday.getDate() + i);

                    // API ожидает day=1..7
                    const dayNum = i + 1;
                    const menu = menuData[dayNum] || { breakfast: [], lunch: [] };

                    weekDays.push({
                        date,
                        dayName: daysOfWeek[i === 6 ? 0 : i + 1], // i=0→Пн, i=1→Вт, ..., i=6→Вс
                        shortDay: shortDays[i],
                        menu
                    });
                }

                setWeeklyMenu(weekDays);

                // Выбрать сегодняшний день
                const today = new Date();
                const todayIndex = weekDays.findIndex(day =>
                    day.date.toDateString() === today.toDateString()
                );
                setSelectedDay(weekDays[todayIndex]?.date || weekDays[0].date);

            } catch (err) {
                console.error('Ошибка загрузки меню:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadWeeklyMenu();
    }, [currentDate]);

    // Навигация
    const previousWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const nextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const today = () => {
        setCurrentDate(new Date());
        setSelectedDay(new Date());
    };

    const selectDay = (date) => {
        setSelectedDay(date);
        setShowBreakfastDetails(null);
        setShowLunchDetails(null);
    };

    const getSelectedDayMenu = () => {
        const selectedMenu = weeklyMenu.find(day => 
            day.date.toDateString() === selectedDay.toDateString()
        );
        return selectedMenu ? selectedMenu.menu : { breakfast: [], lunch: [] };
    };

    // Проверка активного абонемента
    const hasActiveSubscription = (date) => {
        const subs = JSON.parse(localStorage.getItem('subscriptions') || '[]');
        const targetDate = date.toISOString().split('T')[0];
        return subs.some(sub => sub.start_date <= targetDate && targetDate <= sub.end_date);
    };

    // Проверка разовой оплаты
    const isMealPaid = (date, mealType) => {
        const payments = JSON.parse(localStorage.getItem('mealPayments') || '[]');
        const formattedDate = date.toISOString().split('T')[0];
        if (payments.some(p => p.date === formattedDate && p.meal_type === mealType)) return true;
        return hasActiveSubscription(date);
    };

    // Проверка выдачи
    const isMealIssued = (date, mealType) => {
        const issued = JSON.parse(localStorage.getItem('issuedMeals') || '[]');
        const formattedDate = date.toISOString().split('T')[0];
        return issued.some(i => i.date === formattedDate && i.meal_type === mealType);
    };

    // Форматирование даты
    const formatDate = (date) => {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    // Форматирование блюд
    const formatMealItems = (meal) => {
        if (!meal || meal.length === 0) return 'Меню не опубликовано';
        return meal[0]?.menu_items || 'Меню не опубликовано';
    };

    const getMealTotalPrice = (meal) => {
        if (!meal || meal.length === 0) return 0;
        return parseFloat(meal[0]?.price) || 0;
    };

    const getMealTotalQuantity = (meal) => {
        if (!meal || meal.length === 0) return 0;
        return meal[0]?.available_quantity || 0;
    };

    // Оплата
    const handleOrderClick = async (day, price, mealType) => {
        const formattedDate = day.toISOString().split('T')[0];
        const existingPayments = JSON.parse(localStorage.getItem('mealPayments') || '[]');
        const isPaid = existingPayments.some(p => p.date === formattedDate && p.meal_type === mealType);

        if (isPaid) {
            alert('Вы уже оплатили этот приём пищи!');
            return;
        }

        setSelectedDayForPayment(day);
        setSelectedPrice(price);
        setSelectedMealType(mealType);
        setShowPaymentModal(true);
    };

    // Получение текста кнопки
    const getMealButtonText = (date, mealType) => {
        if (isMealIssued(date, mealType)) return 'Выдано';
        if (isMealPaid(date, mealType)) return 'Оплачено';
        return `Оплатить ${mealType === 'breakfast' ? 'завтрак' : 'обед'}`;
    };

    const isMealDisabled = (date, mealType, quantity) => {
        return quantity === 0 || isMealPaid(date, mealType) || isMealIssued(date, mealType);
    };

    if (loading) {
        return (
            <div className="weekly-menu-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Загрузка меню...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="weekly-menu-container">
                <div className="error-message">
                    <p>Ошибка загрузки меню: {error}</p>
                    <button onClick={() => window.location.reload()}>Повторить</button>
                </div>
            </div>
        );
    }

    const selectedMenu = getSelectedDayMenu();
    const breakfastTotalPrice = getMealTotalPrice(selectedMenu.breakfast);
    const lunchTotalPrice = getMealTotalPrice(selectedMenu.lunch);

    return (
        <div className="weekly-menu-container">
            <div className="menu-header">
                <h2>Меню школьной столовой</h2>
                <div className="header-buttons">
                    <button onClick={today} className="today-btn">
                        Сегодня
                    </button>
                </div>
            </div>

            <div className="week-navigation">
                <button onClick={previousWeek} className="nav-btn">
                    ◀ Предыдущая неделя
                </button>
                <div className="current-week">
                    {formatDate(weeklyMenu[0]?.date || new Date())} – 
                    {formatDate(weeklyMenu[6]?.date || new Date())}
                </div>
                <button onClick={nextWeek} className="nav-btn">
                    Следующая неделя ▶
                </button>
            </div>

            <div className="week-days">
                {weeklyMenu.map((day, index) => (
                    <div 
                        key={index}
                        className={`day-card ${isToday(day.date) ? 'today' : ''} ${selectedDay.toDateString() === day.date.toDateString() ? 'selected' : ''}`}
                        onClick={() => selectDay(day.date)}
                    >
                        <div className="day-header">
                            <div className="day-name">{day.shortDay}</div>
                            <div className="day-date">{day.date.getDate()}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="selected-day-details">
                <h3>
                    {daysOfWeek[selectedDay.getDay()]}, {formatDate(selectedDay)}
                    {isToday(selectedDay) && <span className="today-badge"> (Сегодня)</span>}
                </h3>
                
                {selectedMenu.breakfast?.length === 0 && selectedMenu.lunch?.length === 0 ? (
                    <div className="no-menu-message">
                        <h1 className="meal-total-price">Выходной день</h1>
                    </div>
                ) : (
                    <div className="menu-details">
                        {/* Завтрак */}
                        <div className="meal-card">
                            <div className="meal-header">
                                <h2>Завтрак</h2>
                                <h2 className="meal-total-price">{breakfastTotalPrice.toFixed(2)} ₽</h2>
                            </div>
                            
                            {selectedMenu.breakfast ? (
                                <>
                                    <div className="meal-items-preview">
                                        {formatMealItems(selectedMenu.breakfast)}
                                    </div>
                                    
                                    <div className="meal-buttons">
                                        <button 
                                            className="details-btn"
                                            onClick={() => setShowBreakfastDetails(showBreakfastDetails === 'all' ? null : 'all')}
                                        >
                                            {showBreakfastDetails === 'all' ? 'Скрыть подробности' : 'Подробнее'}
                                        </button>
                                        <button 
                                            className="payment-btn"
                                            onClick={() => handleOrderClick(selectedDay, getMealTotalPrice(selectedMenu.breakfast), 'breakfast')}
                                            disabled={isMealDisabled(selectedDay, 'breakfast', getMealTotalQuantity(selectedMenu.breakfast))}
                                        >
                                            {getMealButtonText(selectedDay, 'breakfast')}
                                        </button>
                                    </div>

                                    {showBreakfastDetails === 'all' && (
                                        <div className="meal-details-expanded">
                                            <div className="meal-item-detail">
                                                <p className="item-description">{selectedMenu.breakfast[0]?.menu_items}</p>
                                                <div className="item-meta">
                                                    <span className="item-quantity">
                                                        Осталось: {getMealTotalQuantity(selectedMenu.breakfast)} порций
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="no-items">Меню завтрака отсутствует</p>
                            )}
                        </div>
                        
                        {/* Обед */}
                        <div className="meal-card">
                            <div className="meal-header">
                                <h2>Обед</h2>
                                <h2 className="meal-total-price">{lunchTotalPrice.toFixed(2)} ₽</h2>
                            </div>
                            
                            {selectedMenu.lunch && selectedMenu.lunch.length > 0 ? (
                                <>
                                    <div className="meal-items-preview">
                                        {formatMealItems(selectedMenu.lunch)}
                                    </div>
                                
                                    <div className="meal-buttons">
                                        <button 
                                            className="details-btn"
                                            onClick={() => setShowLunchDetails(showLunchDetails === 'all' ? null : 'all')}
                                        >
                                            {showLunchDetails === 'all' ? 'Скрыть подробности' : 'Подробнее'}
                                        </button>
                                        <button 
                                            className="payment-btn"
                                            onClick={() => handleOrderClick(selectedDay, getMealTotalPrice(selectedMenu.lunch), 'lunch')}
                                            disabled={isMealDisabled(selectedDay, 'lunch', getMealTotalQuantity(selectedMenu.lunch))}
                                        >
                                            {getMealButtonText(selectedDay, 'lunch')}
                                        </button>
                                    </div>

                                    {showLunchDetails === 'all' && (
                                        <div className="meal-details-expanded">
                                            <div className="meal-item-detail">
                                                <p className="item-description">{selectedMenu.lunch[0]?.menu_items}</p>
                                                <div className="item-meta">
                                                    <span className="item-quantity">
                                                        Осталось: {getMealTotalQuantity(selectedMenu.lunch)} порций
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="no-items">Меню обеда отсутствует</p>
                            )}
                        </div>

                        {/* Комплекс */}
                        <div className="meal-card combined-card">
                            <div className="meal-header">
                                <h2>Комплекс</h2>
                            </div>
                            
                            <div className="total-price">
                                {(breakfastTotalPrice + lunchTotalPrice).toFixed(2)} ₽
                            </div>
                            <div className="price-breakdown">
                                <span>Завтрак: {breakfastTotalPrice.toFixed(2)} ₽</span>
                                <span>Обед: {lunchTotalPrice.toFixed(2)} ₽</span>
                            </div>

                            <button 
                                className="payment-btn combined-btn"
                                onClick={() => handleOrderClick(selectedDay, breakfastTotalPrice + lunchTotalPrice, 'combined')}
                                disabled={
                                    getMealTotalQuantity(selectedMenu.breakfast) === 0 ||
                                    getMealTotalQuantity(selectedMenu.lunch) === 0 ||
                                    isMealPaid(selectedDay, 'breakfast') ||
                                    isMealPaid(selectedDay, 'lunch') ||
                                    isMealIssued(selectedDay, 'breakfast') ||
                                    isMealIssued(selectedDay, 'lunch')
                                }
                            >
                                {
                                    (isMealPaid(selectedDay, 'breakfast') || isMealIssued(selectedDay, 'breakfast')) &&
                                    (isMealPaid(selectedDay, 'lunch') || isMealIssued(selectedDay, 'lunch'))
                                        ? 'Оплачено / Выдано'
                                        : (getMealTotalQuantity(selectedMenu.breakfast) === 0 || getMealTotalQuantity(selectedMenu.lunch) === 0)
                                            ? 'Недоступно'
                                            : 'Оплатить комплекс'
                                }
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Модальное окно */}
            {showPaymentModal && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    selectedDay={selectedDayForPayment}
                    price={selectedPrice}
                    mealType={selectedMealType}
                    onPaymentSuccess={(amount) => {
                        console.log(`Оплачено ${amount} руб.`);
                        console.log('mealType:', selectedMealType); // ✅ теперь правильно
                        setShowPaymentModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default WeeklyMenu;