import './MainPage.css';

import { useState, useEffect, useRef } from 'react';

const topUsersToLoadStep = 10;
const updatesDelay = 2000;

function MainPage(props) {
    const [totalClicksCount, setTotalClicksCount] = useState(0);
    const [currentClicksCount, setCurrentClicksCount] = useState(0);
    const [onlineUsersCount, setOnlineUsersCount] = useState(0);
    const [usersCount, setUsersCount] = useState(0);
    const [topUsers, setTopUsers] = useState([]);
    const [sendedLoadFirstlyRequest, setSendedLoadFirstlyRequest] = useState(true);
    const topUsersToLoad = useRef(topUsersToLoadStep);

    const [counter, setCounter] = useState(false);

    function onSuccessLoad(data, callback = () => {}) {
        if (topUsersToLoad.current !== data.topUsersData.length) {
            callback();
            return;
        }

        const arrTopUsers = [];
        let i = 0;
        for (const topUser of data.topUsersData) {
            arrTopUsers.push(
                <div className="top-updater-container" key={ i++ }>
                    <div className="top-updater-left">
                        <span className="top-updater-name">
                            { topUser.userName }
                        </span>
                        {
                        topUser.isOnline ?
                        <span className="top-updater-online">
                            Онлайн
                        </span> : ""
                        }
                    </div>
                    <span className="top-updater-updates-count">
                        { topUser.clicks }
                    </span>
                </div>
            );
        }
        
        setTopUsers(arrTopUsers);
        setTotalClicksCount(data.totalClicks);
        setOnlineUsersCount(data.onlineUsersCount);
        setUsersCount(data.usersCount);

        callback();
    }

    function updateData() {
        if (!currentClicksCount) {
            props.socket.emit("getData", {
                id: props.userId,
                topUsersCount: topUsersToLoad.current,
                firstly: false
            });
        } else {
            props.socket.emit("exchangeData", {
                id: props.userId,
                clicks: currentClicksCount,
                topUsersCount: topUsersToLoad.current,
                firstly: false
            });
        }

        setCurrentClicksCount(0);
    };

    function loadMoreTopUsers() {
        setSendedLoadFirstlyRequest(true);
        props.socket.emit("getData", {
            id: props.userId,
            topUsersCount: topUsersToLoad.current + topUsersToLoadStep,
            firstly: true
        });
    }

    useEffect(() => {
        props.socket.emit("getData", {
            id: props.userId,
            topUsersCount: topUsersToLoad.current,
            firstly: true
        });

        props.socket.on("getDataHandler", data => {
            onSuccessLoad(data);
        });

        props.socket.on("getDataFirstlyHandler", data => {
            topUsersToLoad.current = data.topUsersData.length;
            onSuccessLoad(data, () => setSendedLoadFirstlyRequest(false));
        });
    }, []);

    useEffect(() => {
        if (counter) {
            updateData();
        }
        const id = setTimeout(() => {
            setCounter(counter => !counter);
        }, updatesDelay / 2);
        return () => {
            clearTimeout(id);
        };
    }, [counter]);

    return (
        <div className="page">
            <h1 className="total-updates-text">
                Мапу оновлено стільки разів:
            </h1>
            <span className="total-updates-count">
                { totalClicksCount }
            </span>
            <h1 className="user-updates-text">
                <span className="user-name-text">{ props.userName }</span>, ви оновили мапу стільки разів:
            </h1>
            <span className="user-updates-count">
                { props.userClicks }
            </span>
            <button className="click-btn" onClick={ () => {
                setCurrentClicksCount(currentClicksCount => currentClicksCount + 1);
                props.setUserClicks(userClicks => userClicks + 1);
            } }>
                Оновити мапу
            </button>
            <div className="data-container">
                <span className="data-container-text">
                    Всього користувачів: <span className="data-container-number">{ usersCount }</span>
                </span>
                <span className="data-container-text">
                    Користувачів онлайн: <span className="data-container-number">{ onlineUsersCount }</span>
                </span>
            </div>
            <h2 className="top-updaters-text">
                Топ { topUsers.length } оновлювачів:
            </h2>
            <div className="top-updaters">
                { topUsers }
                { topUsersToLoad.current < usersCount ? 
                <button className="load-more-users" onClick={ loadMoreTopUsers } disabled={ sendedLoadFirstlyRequest }>
                    Завантажити ще { Math.min(topUsersToLoadStep, usersCount - topUsersToLoad.current) } користувачів
                </button> : ""
                }
            </div>
        </div>
    );
}

export default MainPage;