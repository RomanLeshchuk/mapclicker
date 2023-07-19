const express = require("express");
const path = require("path");
const app = express();
app.use(express.static(path.resolve(__dirname, '../client/build')));

const server = require("http").createServer(app);
const io = require("socket.io")(server);

const mysql = require("mysql");
const bcrypt = require("bcrypt");

const saltRounds = 10;
const intervalToConsiderUserOffline = 5;

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "mapclickerbase"
});

con.connect(err => {
    if (err) {
        throw err;
    }

    runServer();
});

const PORT = 3001;

function getTimestamp() {
    return Math.floor(Date.now() / 1000);
}

function updateSession(id, callback = () => {}) {
    con.query("UPDATE users SET lastActivity = ? WHERE id = ?", [getTimestamp(), id], err => {
        if (err) {
            throw err;
        }
        callback();
    });
}

function runServer() {
    io.sockets.on("connection", socket => {
        socket.on("signUp", data => {
            errors = [];
            if (data.name.length < 1 || data.name.length > 30) {
                errors.push("Ім'я має містити від 1 до 30 символів")
            }
            if (data.password.length < 8 || data.password.length > 72) {
                errors.push("Пароль має містити від 8 до 72 символів")
            }
    
            con.query("SELECT id FROM users WHERE userName = ?", [data.name], (err, result) => {
                if (err) {
                    throw err;
                }
                if (result.length) {
                    errors.push("Введенe ім'я вже використовується");
                }
                
                if (errors.length) {
                    socket.emit("signUpHandler", {
                        errors: errors
                    });
                } else {
                    bcrypt.hash(data.password, saltRounds).then(hash => {
                        con.query("INSERT INTO users (userName, userPassword, clicks, lastActivity) VALUES (?, ?, 0, ?)", [data.name, hash, getTimestamp()], (err, result) => {
                            if (err) {
                                throw err;
                            }
                            socket.emit("signUpHandler", {
                                id: result.insertId
                            });
                        });
                    }).catch(err => {
                        throw err;
                    });
                }
            });
        });

        socket.on("logIn", data => {
            errors = [];

            con.query("SELECT id, userPassword, clicks, lastActivity FROM users WHERE userName = ?", [data.name], (err, result) => {
                function genResponse() {
                    if (errors.length) {
                        socket.emit("logInHandler", {
                            errors: errors
                        });
                    } else {
                        updateSession(result[0].id, () => {
                            socket.emit("logInHandler", {
                                id: result[0].id,
                                clicks: result[0].clicks
                            });
                        });
                    }
                }

                if (err) {
                    throw err;
                }
                
                if (!result.length) {
                    errors.push("Неправильне ім'я");
                    genResponse();
                } else {
                    bcrypt.compare(data.password, result[0].userPassword).then(areSame => {
                        if (!areSame) {
                            errors.push("Неправильний пароль");
                        }
                        else if (getTimestamp() - result[0].lastActivity < intervalToConsiderUserOffline) {
                            errors.push("Цей користувач зараз онлайн");
                        }
                        genResponse();
                    }).catch(err => {
                        throw err;
                    });
                }
            });
        });

        socket.on("getData", data => {
            responseData = [undefined, undefined, undefined];

            function tryRun() {
                if (!responseData.some(elem => elem === undefined)) {
                    const handler = data.firstly ? "getDataFirstlyHandler" : "getDataHandler";
                    socket.emit(handler, {
                        topUsersData: responseData[0],
                        usersCount: responseData[1].totalUsersCount,
                        totalClicks: responseData[1].totalClicksCount,
                        onlineUsersCount: responseData[2]
                    });
                }
            }

            data.topUsersCount = Number(data.topUsersCount);
            if (data.topUsersCount === NaN) {
                data.topUsersCount = 10;
            }

            con.query(`SELECT userName, clicks, lastActivity FROM users ORDER BY clicks DESC LIMIT ${data.topUsersCount}`, (err, topUsersData) => {
                if (err) {
                    throw err
                }

                const timestamp = getTimestamp();
                for (const topUserData of topUsersData) {
                    topUserData.isOnline = (timestamp - topUserData.lastActivity < intervalToConsiderUserOffline);
                    delete topUserData.lastActivity;
                }

                responseData[0] = topUsersData;
                tryRun();
            });

            con.query("SELECT COUNT(id) AS totalUsersCount, SUM(clicks) AS totalClicksCount FROM users", (err, countData) => {
                if (err) {
                    throw err
                }

                responseData[1] = countData[0];
                tryRun();
            });

            updateSession(data.id, () => {
                con.query(
                    "SELECT COUNT(id) AS onlineUsersCount FROM users WHERE ? - lastActivity < ?",
                    [getTimestamp(), intervalToConsiderUserOffline], (err, onlineUsersData) => {
                    if (err) {
                        throw err
                    }
    
                    responseData[2] = onlineUsersData[0].onlineUsersCount;
                    tryRun();
                });
            });
        });

        socket.on("exchangeData", data => {
            responseData = [undefined, undefined, undefined];

            function tryRun() {
                if (!responseData.some(elem => elem === undefined)) {
                    const handler = data.firstly ? "getDataFirstlyHandler" : "getDataHandler";
                    socket.emit(handler, {
                        topUsersData: responseData[0],
                        usersCount: responseData[1].totalUsersCount,
                        totalClicks: responseData[1].totalClicksCount,
                        onlineUsersCount: responseData[2]
                    });
                }
            }

            con.query("UPDATE users SET clicks = clicks + ?, lastActivity = ? WHERE id = ?", [Math.max(Math.min(data.clicks, 300), 0), getTimestamp(), data.id], err => {
                if (err) {
                    throw err;
                }

                data.topUsersCount = Number(data.topUsersCount);
                if (data.topUsersCount === NaN) {
                    data.topUsersCount = 10;
                }

                con.query(`SELECT userName, clicks, lastActivity FROM users ORDER BY clicks DESC LIMIT ${data.topUsersCount}`, (err, topUsersData) => {
                    if (err) {
                        throw err
                    }
    
                    const timestamp = getTimestamp();
                    for (const topUserData of topUsersData) {
                        topUserData.isOnline = (timestamp - topUserData.lastActivity < intervalToConsiderUserOffline);
                        delete topUserData.lastActivity;
                    }
    
                    responseData[0] = topUsersData;
                    tryRun();
                });

                con.query("SELECT COUNT(id) AS totalUsersCount, SUM(clicks) AS totalClicksCount FROM users", (err, countData) => {
                    if (err) {
                        throw err
                    }
    
                    responseData[1] = countData[0];
                    tryRun();
                });

                con.query(
                    "SELECT COUNT(id) AS onlineUsersCount FROM users WHERE ? - lastActivity < ?",
                    [getTimestamp(), intervalToConsiderUserOffline], (err, onlineUsersData) => {
                    if (err) {
                        throw err
                    }
    
                    responseData[2] = onlineUsersData[0].onlineUsersCount;
                    tryRun();
                });
            });
        });
    });
    
    server.listen(PORT, () => {
        console.log(`Server listening on ${PORT}`);
    });
}