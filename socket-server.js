const _ = require('lodash')
const Domino = require('./dominoes')
const io = require("socket.io")(3000, {
    cors: {
        origin: '*',
        credentials: false
    },
    allowEIO3: true,
    rejectUnauthorized: false
});

let dominoPool = []
let standartPoolCount = 7
let userPool = []
let opponentPool = []
let shopPool = []

let fieldPool = [] // Общий пул, используемый на столе при выставлении домино


let wasUserPoolRecieved = false

let firstTurn = Math.round(getRandomValueBetween(0, 1)) // выкидываем монетку на право первого хода
let userTurn = firstTurn === 1
let opponentTurn = firstTurn === 0

console.log('user: ' + userTurn + 'opponentTurn: ' + opponentTurn)


io.on("connect_error", (err) => { console.log(`connect_error due to ${err.message}`); });
io.on('connect', socket => {
    socket.on('checkAvaliablePlacement', obj => {
        if (fieldPool.length == 0) { // TODO: Обработать рыбу
            socket.emit('recieveAvaliablePlacement', {
                leftSide: false,
                rightSide: false,
                emptyField: true,
            })
            fieldPool[0] = {}
            fieldPool[0].left = obj.leftSide
            fieldPool[0].right = obj.rightSide
            console.log(fieldPool)
        } else {
            socket.emit('recieveAvaliablePlacement', {
                leftSide: obj.leftSide == fieldPool[0].left || obj.rightSide == fieldPool[0].left,
                rightSide: obj.leftSide == fieldPool[0].right || obj.rightSide == fieldPool[0].right,
                emptyField: false,
            })
        }
    })
    socket.on('joinRoom', room => {
        socket.join(room)
        const dominoRoom = socket.adapter.rooms.get('domino')
        dominoPool = []
        userPool = []
        opponentPool = []
        shopPool = []
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

            if (!wasUserPoolRecieved) {
                socket.emit('recievePool', userPool)
                console.log('Отправил оппоненту: ' + opponentTurn)
                console.log('отправил юзеру:' + userTurn)
                console.log('userPool-------------------------')
                console.log(userPool)
                console.log('opponent ------------------------')
                console.log(opponentPool)
            } else {
                socket.broadcast.emit('recievePool', opponentPool)
            }
            socket.emit('turn', userTurn)
            socket.broadcast.emit('turn', opponentTurn)
        }
    })

    socket.on('changeTurn', () => {
        userTurn = !userTurn
        opponentTurn = !opponentTurn
        socket.emit('turn', userTurn)
        socket.broadcast.emit('turn', opponentTurn)
    })


    socket.on('getShopDomino', () => {
        if (shopPool.length > 1) {
            let shopDomino = shopPool[Math.round(getRandomValueBetween(0, shopPool.length - 1))] // получение случайной доминошки
            shopPool = shopPool.filter(e => e.leftSide != shopDomino.leftSide || e.rightSide != shopDomino.rightSide) // убираем выбранную доминошку из пула и выдаем ее клиенту
            socket.emit('recieveShopDomino', shopDomino)
        } else socket.emit('recieveShopDomino', { message: 'Базар пуст' })
    })

    socket.on('gameOver', () => {
        // отсылаем проигравшему сообщение о проигрыше
        socket.broadcast.emit('gameOver')
    })


    socket.on('attemptDominoPlace', domino => {
        let bone = JSON.parse(domino.domino)
        let boneTargetSide = domino.targetSide
        let reverse // будет ли доминошка реверснута
        if (boneTargetSide == 'right') {
            if (bone.rightSide == fieldPool[0].right) {
                reverse = true
                fieldPool[0].right = bone.leftSide
            } else fieldPool[0].right = bone.rightSide
        } else if (boneTargetSide == 'left') {
            if (bone.leftSide == fieldPool[0].left) {
                reverse = true
                fieldPool[0].left = bone.rightSide
            } else fieldPool[0].left = bone.leftSide
        }

        socket.emit('placeDomino', {
            rightSide: bone.rightSide,
            leftSide: bone.leftSide,
            first: true,
            target: boneTargetSide,
            reverse
        })

        socket.broadcast.emit('placeDomino', {
            rightSide: bone.rightSide,
            leftSide: bone.leftSide,
            first: true,
            target: domino.targetSide,
            reverse
        })

    })
})

function getRandomValueBetween(min, max) {
    return Math.random() * (max - min) + min;
}