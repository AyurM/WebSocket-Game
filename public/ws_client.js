window.onload = connectWS;

let socket;
let gameState;
let playerSize = 16;
const port = 3000;
const serverAddress = "ws://192.168.0.3";

function connectWS() {
    socket = new WebSocket(`${serverAddress}:${port}/`);

    socket.onopen = function() {
        alert("Соединение установлено");
        document.addEventListener('keydown', handleKeyPress);
    };

    socket.onclose = function(event) {
        if (event.wasClean) {
            alert('Соединение закрыто');
        } else {
            alert('Обрыв соединения!');
        }
    };

    //Обработчик сообщений от сервера
    socket.onmessage = function(message) {
        console.log(message.data);
        let gameObject = JSON.parse(message.data);

        //Пришедшее сообщение является состоянием игры
        if (gameObject.hasOwnProperty('players')) {
            gameState = gameObject;
            showGameState();
        } else {
            //В пришедшем сообщении указан номер отсоединившегося игрока
            onPlayerDisconnected(gameObject.index);
        }
    };

    socket.onerror = function(error) {
        alert("Ошибка: " + error.message);
    };
}

function showGameState() {
    for (let i = 0; i < gameState.players.length; i++) {
        let player = gameState.players[i];
        let playerDiv = document.getElementById(player.index);

        //В HTML нет игрока с данным индексом, создать и добавить его
        if (playerDiv === null) {
            playerDiv = document.createElement("div");
            setPlayerStyle(playerDiv, player);
            document.getElementById("board").appendChild(playerDiv); //добавить игрока в HTML
        } else {
            //Игрок есть, достаточно обновить его позицию
            updatePlayerPosition(playerDiv, player);
        }
    }
}

function setPlayerStyle(playerDiv, player) {
    playerDiv.setAttribute("id", player.index);
    //Задать все необходимые элементы стиля
    playerDiv.setAttribute("style", "width: " + playerSize +
        "px; height: " + playerSize + "px; left: " +
        player.position[0] + "px; top: " + player.position[1] + "px; background: " +
        player.color + "; position: absolute;");
}

function updatePlayerPosition(playerDiv, player) {
    playerDiv.style.left = player.position[0] + "px";
    playerDiv.style.top = player.position[1] + "px";
}

function onPlayerDisconnected(index) {
    //При дисконнекте игрока убрать из разметки связанный с ним div
    let playerDiv = document.getElementById(index);
    playerDiv.parentNode.removeChild(playerDiv);
}

function sendMessage(message) {
    socket.send(message);
    console.log(message);
}

function handleKeyPress(e) {
    switch (e.keyCode) {
        case 37:
            sendMessage("left");
            break;
        case 38:
            sendMessage("up");
            break;
        case 39:
            sendMessage("right");
            break;
        case 40:
            sendMessage("down");
            break;
    }
}