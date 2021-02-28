const http = require('http');
const express = require('express');
const webSocketServer = require('websocket').server;
const port = 3000;

const app = express();
app.use(express.static("public"));

//Список подключенных пользователей
let clients = [];

//Настройки игры
let gameSettings = {
    playerSpeed: 10,
    boardWidth: 922,
    boardHeight: 576,
};

//Состояние игры
let gameState = {
    players: [],
};

let playerDisconnected = {
    index: -1,
};

//Массив с цветами для игроков
const colors = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange', 'white', 'yellow'];

//Создать сервер
const server = http.createServer(app);
let wsServer = new webSocketServer({
    httpServer: server
});

//WebSocket сервер
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from ' + request.origin);

    let connection = request.accept(null, request.origin);

    //Нужно знать индекс клиента, чтобы убрать его в событии 'close'
    let index = clients.push(connection) - 1;
    console.log((new Date()) + ' Connection accepted');

    //Создание нового игрока со случайным цветом и стартовой позицией
    let newPlayer = {
        index: index,
        position: [
            Math.floor(Math.random() * gameSettings.boardWidth),
            Math.floor(Math.random() * gameSettings.boardHeight)
        ],
        color: colors.shift()
    };

    //Добавить созданного игрока к состоянию игры
    gameState.players.push(newPlayer);
    //Разослать обновленное состояние игры всем игрокам
    sendGameState();

    //Обработчик сообщений от игрока
    connection.on('message', function(message) {
        //console.log("From: " + index + "; Msg: " + message.utf8Data);
        handleCommand(index, message.utf8Data); //обработать команду
        sendGameState(); //разослать обновленное состояние игры всем игрокам
    });

    //Пользователь отсоединился
    connection.on('close', function(connection) {
        let color = gameState.players[index].color;
        console.log((new Date()) + " Player " +
            connection.remoteAddress + " disconnected");
        //Убрать пользователя из списка подключенных клиентов
        clients.splice(index, 1);
        //Убрать игрока из состояния игры
        gameState.players.splice(index, 1);
        //Разослать сообщение о дисконнекте игрока	
        sendPlayerDisconnected(index);
        //Вернуть цвет игрока в общий массив цветов
        colors.push(color);
    });
});

function sendGameState() {
    for (let i = 0; i < clients.length; i++) {
        clients[i].sendUTF(JSON.stringify(gameState));
    }
}

function sendPlayerDisconnected(index) {
    playerDisconnected.index = index;
    for (let i = 0; i < clients.length; i++) {
        clients[i].sendUTF(JSON.stringify(playerDisconnected));
    }
}

function handleCommand(index, command) {
    let player = gameState.players[index];
    if (player === null) {
        return;
    }
    if (command === "left") {
        if (player.position[0] > gameSettings.playerSpeed) {
            player.position[0] -= gameSettings.playerSpeed;
        }
    } else if (command === "right") {
        if (player.position[0] < gameSettings.boardWidth) {
            player.position[0] += gameSettings.playerSpeed;
        }
    } else if (command === "up") {
        if (player.position[1] > gameSettings.playerSpeed) {
            player.position[1] -= gameSettings.playerSpeed;
        }
    } else if (command === "down") {
        if (player.position[1] < gameSettings.boardHeight) {
            player.position[1] += gameSettings.playerSpeed;
        }
    }
}


server.listen(port, (err) => {
    if (err) {
        return console.log('Error on server start!', err);
    }
    console.log(`Server is listening on ${port}`);
});
