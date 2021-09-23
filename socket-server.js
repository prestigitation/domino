const _ = require('lodash')
const Domino = require('./dominoes')
const io = require("socket.io")(3000, {
    withCredentials: true,
    cors: {
        origin: 'http://127.0.0.1:5500',
        credentials: true
    },
    allowEIO3: true
});

let dominoPool = []
let standartPoolCount = 7
let userPool = []
let opponentPool = []
let shopPool = []

let fieldPool = [] // Общий пул, используемый на столе при выставлении домино


let wasUserPoolRecieved = false



io.on("connect_error", (err) => { console.log(`connect_error due to ${err.message}`); });
io.on('connect', socket => {
    socket.on('checkAvaliablePlacement', (obj) => {
        if (fieldPool.length === 0) { // TODO: Добавить условие с rightSide i leftSide
            socket.emit('recieveAvaliablePlacement', {
                leftSide: true,
                rightSide: true,
                emptyField: true,
            })
        }
    })
    socket.on('joinRoom', (room) => {
        socket.join(room)
        const dominoRoom = socket.adapter.rooms.get('domino')
        console.log(dominoRoom.size)
        if (dominoRoom.size === 2) { // если подключился только игрок и его оппонент
            for (let i = 0; i < standartPoolCount; i++) {
                for (let j = i; j < standartPoolCount; j++) {
                    if (!_.includes(dominoPool, new Domino(i, j)))
                        dominoPool.push(new Domino(i, j))
                }
            }
            for (let t = 0; t < standartPoolCount - 1; t++) {
                let randValue = Math.round(getRandomValueBetween(0, dominoPool.length - 1))
                let opponentRandValue = Math.round(getRandomValueBetween(0, dominoPool.length - 1))
                let userDomino = dominoPool[randValue]
                let opponentDomino = dominoPool[opponentRandValue]
                if (!_.includes(userPool, userDomino) && !_.includes(opponentPool, userDomino)) {
                    userPool.push(userDomino)
                } else {
                    do {
                        userDomino = dominoPool[Math.round(getRandomValueBetween(0, dominoPool.length - 1))]
                    } while (_.includes([...userPool, ...opponentPool], userDomino))
                    userPool.push(userDomino)
                }

                if (!_.includes(userPool, opponentDomino) && !_.includes(opponentPool, opponentDomino)) {
                    opponentPool.push(opponentDomino)
                } else {
                    do {
                        opponentDomino = dominoPool[Math.round(getRandomValueBetween(0, dominoPool.length - 1))]
                    } while (_.includes([...userPool, ...opponentPool], opponentDomino))
                    opponentPool.push(opponentDomino)
                }
            }
            for (let a in dominoPool) {
                if (!_.includes([...userPool, ...opponentPool], dominoPool[a])) {
                    shopPool.push(dominoPool[a])
                }
            }
            let users = [...dominoRoom]
            if (!wasUserPoolRecieved) {
                socket.emit('recievePool', userPool)
            } else socket.emit('recievePool', opponentPool)

            dominoPool = []
            userPool = []
            opponentPool = []
            shopPool = []
                //socket.emit('recievePool', opponentPool)
        }
        // console.log('joined' + room)
    })
})

function getRandomValueBetween(min, max) {
    return Math.random() * (max - min) + min;
}