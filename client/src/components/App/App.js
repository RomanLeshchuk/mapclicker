import { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io } from "socket.io-client";

import Register from '../Register/Register';
import MainPage from '../MainPage/MainPage';

const socket = io("ws://localhost:3001");

function App() {
    const [userId, setUserId] = useState(undefined);
    const [userName, setUserName] = useState(undefined);
    const [userClicks, setUserClicks] = useState(0);

    const appElement = userId === undefined
    ? <Register setUserId={ setUserId } setUserClicks={ setUserClicks } setUserName={ setUserName } socket={ socket } />
    : <MainPage userId={ userId } userClicks={ userClicks } setUserClicks={ setUserClicks } userName={ userName } socket={ socket } />;

    return (
        <Router>
            <Routes>
                <Route path='/'>
                    <Route index element={ appElement } />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;