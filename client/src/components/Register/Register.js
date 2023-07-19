import './Register.css';

import { useState, useEffect, useRef } from 'react';

function Register(props) {
    const [registerSignUpErrors, setRegisterSignUpErrors] = useState([]);
    const [registerLogInErrors, setRegisterLogInErrors] = useState([]);

    const signUpName = useRef(undefined);
    const signUpPassword = useRef(undefined);
    const [sendedSignUpRequest, setSendedSignUpRequest] = useState(false);
    
    const logInName = useRef(undefined);
    const logInPassword = useRef(undefined);
    const [sendedLogInRequest, setSendedLogInRequest] = useState(false);
    
    useEffect(() => {
        props.socket.on("signUpHandler", data => {
            if (data.errors !== undefined) {
                setRegisterSignUpErrors(data.errors);
            } else {
                props.setUserId(data.id);
                props.setUserName(signUpName.current.value);
            }
            setSendedSignUpRequest(false);
        });

        props.socket.on("logInHandler", data => {
            if (data.errors !== undefined) {
                setRegisterLogInErrors(data.errors);
            } else {
                props.setUserId(data.id);
                props.setUserClicks(data.clicks);
                props.setUserName(logInName.current.value);
            }
            setSendedLogInRequest(false);
        });
    }, []);

    function signUp(evt) {
        evt.preventDefault();
        setSendedSignUpRequest(true);

        props.socket.emit("signUp", {
            name: signUpName.current.value === undefined ? "" : signUpName.current.value,
            password: signUpPassword.current.value === undefined ? "" : signUpPassword.current.value
        });
    }

    function logIn(evt) {
        evt.preventDefault();
        setSendedLogInRequest(true);
        
        props.socket.emit("logIn", {
            name: logInName.current.value === undefined ? "" : logInName.current.value,
            password: logInPassword.current.value === undefined ? "" : logInPassword.current.value
        });
    }

    const signUpErrors = [];
    for (let i = 0; i < registerSignUpErrors.length; i++) {
        signUpErrors.push(
            <p className="register-error" key={ i }>
                { registerSignUpErrors[i] }
            </p>
        );
    }

    const logInErrors = [];
    for (let i = 0; i < registerLogInErrors.length; i++) {
        logInErrors.push(
            <p className="register-error" key={ i }>
                { registerLogInErrors[i] }
            </p>
        );
    }

    return (
        <div className="register">
            <form className="sign-up" action="#">
                <h1 className="register-title">
                    Зареєструватися
                </h1>
                <div className="input-container">
                    <label className="register-label" htmlFor="sign-up-name">
                        Ім'я: 
                    </label>
                    <input className="register-input" type="text" id="sign-up-name" ref={ signUpName } required />
                </div>
                <div className="input-container">
                    <label className="register-label" htmlFor="sign-up-password">
                        Пароль: 
                    </label>
                    <input className="register-input" type="password" id="sign-up-password" ref={ signUpPassword } required />
                </div>
                <div className="error-container">
                    { signUpErrors }
                </div>
                <button className="register-btn" type="submit" onClick={ evt => signUp(evt) } disabled={ sendedSignUpRequest }>
                    Зареєструватися
                </button>
            </form>
            <form className="log-in" action="#">
                <h1 className="register-title">
                    Увійти
                </h1>
                <div className="input-container">
                    <label className="register-label" htmlFor="log-in-name">
                        Ім'я: 
                    </label>
                    <input className="register-input" type="text" id="log-in-name" ref={ logInName } required />
                </div>
                <div className="input-container">
                    <label className="register-label" htmlFor="log-in-password">
                        Пароль: 
                    </label>
                    <input className="register-input" type="password" id="log-in-password" ref={ logInPassword } required />
                </div>
                <div className="error-container">
                    { logInErrors }
                </div>
                <button className="register-btn" type="submit" onClick={ evt => logIn(evt) } disabled={ sendedLogInRequest }>
                    Увійти
                </button>
            </form>
        </div>
    );
}

export default Register;