
let btnEnter = document.querySelector('button#btnEnter');
let namePlayer = document.querySelector('input#namePlayer');
let btnGiveCards = document.querySelector('a#btnGiveCards');
let bntClearTableBoard = document.querySelector('a#bntClearTableBoard');
let socket = io('http://localhost:3000');

let getMessages = (messages) => {
    console.log(messages);
}

let enterPlayer = () => {
    let elemNamePlayer = document.querySelector('input#namePlayer')
    let name = elemNamePlayer.value;
    let player = { name };
    socket.emit('sendPlayer', player);
    elemNamePlayer.value = '';
    elemNamePlayer.focus();
}

let renderPlayer = player => {
    let playerElement = document.querySelector(`span#player`);
    playerElement.innerHTML = player['name'];
    playerElement.dataset.player = player['id'];


    if (player['hand']) { 
        let hand = [];
        player['hand'].map((card, key) => hand.push(`
            <a href="javascript: void(0);" onclick="putCardOnTableBoard(this)" class="cardPlayer" data-player="${player['id']}" data-card="${key}">
                [${card[0]}${card[1]}]
            </a>
            <a href="javascript: void(0);" onclick="putCardOnTableBoard(this, true)" class="cardPlayer" data-player="${player['id']}" data-card="${key}">
                &#8634
            </a>
            `)
        );
        document.querySelector(`div#hand`).innerHTML = hand;
    }
};

let renderPlayerParticipant = player => {
    let positionPlayers = [0, 1, 2, 3];
    positionPlayers.filter(key => {
        
        return key != player.id
    });
    let playerElement = document.querySelector(`span#player${3 - player['id']}`);
    playerElement.innerHTML = player['name'];
    playerElement.dataset.player = player['id'];
    if (player['hand']) { 
        let hand = [];
        player['hand'].map(() => hand.push(`[&#9744]`));
        // let participant = document.getElementById(`player${3 - player['id']}`)
        document.querySelector(`div#hand${3 - player['id']}`).innerHTML = hand;
    }
};

let renderTableBoard = tableBoard => document.querySelector(`div#tableBoard`).innerHTML = tableBoard;

let clearTableBoard = () => document.querySelector('div#tableBoard').innerHTML = "";

bntClearTableBoard.onclick = () => {
    clearTableBoard();
    socket.emit('clearTableBoard');
}

let putCardOnTableBoard = (card, turned) => socket.emit('putCardOnTableBoard', card.dataset, turned);

// socket.on('previousPlayers', players => {
//     players.map(player => renderPlayer(player));
// });

socket.on('previousTableBoard', tableBoard => renderTableBoard(tableBoard));

let getPlayerElementId = () => document.querySelector(`span#player`).dataset.player;

socket.on('receivedPlayer', player => {
    if (typeof getPlayerElementId() === 'undefined' || getPlayerElementId() == player.id) {
        renderPlayer(player);
    } else {
        renderPlayerParticipant(player);
    }
});

socket.on('receivedTableBoard', tableBoard => renderTableBoard(tableBoard));

socket.on('messages', messages => getMessages(messages));

btnEnter.onclick = event => {
    event.preventDefault();
    enterPlayer();
}

namePlayer.onkeypress = event => {
    if (event.which == 13 || event.keyCode == 13) enterPlayer();
}

btnGiveCards.onclick = () => {
    socket.emit('giveCards');
    clearTableBoard();
}