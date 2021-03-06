'use strict';

const express = require('express');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;
// const INDEX = '/index.html';

// const server = express()
//     .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
//     .listen(PORT, () => console.log(`Listening on ${PORT}`)); 
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const LIMIT_PLAYERS = 4;
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use('/', (req, res) => {
    res.render('index.html');
});

let messages = { success: [], errors: []};
let cardsvalue = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
// let suits = ['Clubs', 'Hearts', 'Spades', 'Diamons'];
let suits = ['&#9827', '&#9829', '&#9824', '&#9830'];
let shackle = [['7', 'Diamons'], ['A', 'Spades'], ['A', 'Hearts'], ['4', 'Clubs']];
let cards = [];
let players = [];
let team = [];
let tableBoard = [];
let positionPlayers = [
    [0, 1, 2, 3],
    [1, 2, 3, 0],
    [2, 3, 0, 1],
    [3, 0, 1, 2]
]

let resetCards = () => {
    cards = [];
    cardsvalue.map(card => suits.map(suit => cards.push([card, suit])));
}

let shuffleCards = () => {
    let currentIndex = cards.length, temporaryCard, randomIndex;
    while(0 != currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        temporaryCard = cards[currentIndex];
        cards[currentIndex] = cards[randomIndex];
        cards[randomIndex] = temporaryCard;
    }
}

let giveCards = () => {
    players.map(player => {
        let count = 1;
        player['hand'] = [];
        while (count <= 3) {
            player['hand'].push(cards.pop());
            count++;
        }
        let position = getPositionPlayer(player);
        io.emit('receivedPlayer', player, position);
    });
    tableBoard = [];
    io.emit('receivedTableBoard', tableBoard);
}

let getPlayerById = playerid => players.filter(player => player.id == playerid).pop();

let savePlayer = playerPrepare => players.map(player => {
    if (player.id == playerPrepare.id) player = playerPrepare;
});

let addCardOnTableBoard = (card, turned = false) => {
    if (tableBoard.length < 4) tableBoard.push(!turned ? `[${card[0]}${card[1]}]` : `&#9744`);
}

let removeCardOfHandPlayer = (cardPlayer) => {
    let player = getPlayerById(cardPlayer.player);
    let card = player['hand'][cardPlayer.card];
    player['hand'] = player['hand'].filter(v => v !== card);
    savePlayer(player);
    return { player, card };
}

let numOfPlayers = () => players.length + 1;

let limitPlayers = () => { 
    try {
        if(numOfPlayers() > LIMIT_PLAYERS) throw "Room is full."; 
    } catch (error) {
        messages.errors.push(error);
        return true;
    }
    return false;
}

// Get the position on Player is added
let getPositionPlayer = player => {
    if (!players.length) return 0;
    let position = 0;
    players.map((_player, _position) => {
        if (_player['id'] === player['id']) position = _position;
    });
    return position;
}

let setPlayer = player => {
    player['id'] = players.length;
    players.push(player);
    return player;
}

io.on('connection', socket => {
    console.log(`Socket conectado: ${socket.id}`);

    socket.on('sendPlayer', player => {
        if (limitPlayers()) {
            socket.emit('messages', messages);
            return false;
        }
        player = setPlayer(player);
        io.emit('receivedTableBoard', tableBoard);
        socket.emit('receivedPlayer', player);
        socket.emit('receivedPositionTableBoard', positionPlayers[getPositionPlayer(player)]);
    });

    socket.on('giveCards', () => {
        resetCards();
        shuffleCards();
        giveCards();
    });

    socket.on('clearTableBoard', () => {
        tableBoard = []
        io.emit('receivedTableBoard', tableBoard);
    });
    
    socket.on('putCardOnTableBoard', (cardPlayer, turned = false) => {
        console.log(cardPlayer, turned);
        player = removeCardOfHandPlayer(cardPlayer);
        addCardOnTableBoard(player.card, turned);
        io.emit('receivedTableBoard', tableBoard);
        let position = getPositionPlayer(player.player);
        io.emit('receivedPlayer', player.player, position);
    });
    
    socket.emit('previousPlayers', players);

    socket.emit('previousTableBoard', tableBoard);
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
server.listen(PORT);