const { size, isObject, isNumber } = require('lodash');
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
let commonDominoPool = []
let commonShopPool = []

//TODO: заход с дубля
//TODO:  4 игрока
//TODO: Обработать рыбу
/*let poolIncludes = () => {
                        let result
                        for (let i = 0; i < commonDominoPool.length; i++) {
                            for (let j = 0; j < standartPoolCount; j++) {
                                if (_.isEqual(commonDominoPool[i][j], selectedDomino)) { //find
                                    result = true
                                } else continue
                            }
                        }
                        return result
                    }*/

let fieldPool = [] // Общий пул, используемый на столе при выставлении домино

let dominoRoom

let poolHasStartDouble
let turn // id сокета, который имеет право на ход. меняется по функции change turn и при инициализации стола

/*let firstTurn = Math.round(getRandomValueBetween(0, 1)) // выкидываем монетку на право первого хода
let userTurn = firstTurn === 1
let opponentTurn = firstTurn === 0*/




io.on("connect_error", (err) => { console.log(`connect_error due to ${err.message}`); });
io.on('connect', socket => {
    socket.on('checkAvaliablePlacement', obj => {
        if (fieldPool.length == 0) {
            socket.emit('recieveAvaliablePlacement', {
                leftSide: false,
                rightSide: false,
                emptyField: true,
            })
            fieldPool[0] = {}
            fieldPool[0].left = obj.leftSide
            fieldPool[0].right = obj.rightSide
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
        dominoRoom = socket.adapter.rooms.get('domino')
        dominoPool = []
        userPool = []
        opponentPool = []
        shopPool = []
        commonDominoPool = []

        for (let j = 0; j < standartPoolCount; j++) {
            for (let t = j; t < standartPoolCount; t++) {
                if (!_.includes(dominoPool, new Domino(j, t)))
                    dominoPool.push(new Domino(j, t))
            }
        }

        for (let i = 0; i < dominoRoom.size; i++) {
            let pool = []
            for (let k = 0; k < standartPoolCount; k++) {
                let selectedDomino = getRandomDomino()
                if (existsInPool(commonDominoPool, selectedDomino)) {
                    do {
                        selectedDomino = getRandomDomino()
                    } while (existsInPool(commonDominoPool, selectedDomino))
                }
                let newArr = pool
                newArr.push(selectedDomino)
                pool = _.uniq(newArr)
            }
            commonDominoPool[i] = pool
        }

        commonShopPool = []
        for (let a in dominoPool) {
            if (!_.includes(commonDominoPool[0], dominoPool[a]) && !_.includes(commonDominoPool[1], dominoPool[a]) && !_.includes(commonDominoPool[2], dominoPool[a]) && !_.includes(commonDominoPool[3], dominoPool[a])) {
                commonShopPool.push(dominoPool[a])
            }
        }

        console.log('shop--------------------------------')
        console.log(commonShopPool)

        console.log('0 клиент------------------------------')
        console.log(commonDominoPool[0])

        console.log('1 клиент-------------------------------')
        console.log(commonDominoPool[1])

        console.log('2 клиент-------------------------------')
        console.log(commonDominoPool[2])

        console.log('3 клиент-------------------------------')
        console.log(commonDominoPool[3])
            //console.log(dominoPool)

        let usersPoolIndex = 0

        //FIXME: Домино не приходят в положенном количестве, проверить на дубликаты
        let userTurns = getUserTurns(dominoRoom.size, commonDominoPool)
        console.log('turns: ' + userTurns)
        poolHasStartDouble = userTurns.filter(el => el === true).length === 1

        if (poolHasStartDouble) {
            usersPoolIndex = userTurns.indexOf(true)
        }
        for (let i of dominoRoom) {
            io.to(i).emit('recievePool', commonDominoPool[usersPoolIndex])

            if (poolHasStartDouble) {
                console.log('sended to : ' + i + ' ' + userTurns[usersPoolIndex])
                io.to(i).emit('turn', userTurns[usersPoolIndex])
                if (userTurns[usersPoolIndex]) {
                    turn = Array.from(dominoRoom)[usersPoolIndex]
                }
            }
            usersPoolIndex++
        }

        console.log('turn change on shop: ' + turn)




        /*if (dominoRoom.size === 2) { // если подключился только игрок и его оппонент
            for (let i = 0; i < standartPoolCount; i++) {
                for (let j = i; j < standartPoolCount; j++) {
                    if (!_.includes(dominoPool, new Domino(i, j)))
                        dominoPool.push(new Domino(i, j))
                }
            }
            for (let t = 0; t < standartPoolCount; t++) {
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
            } else {
                socket.broadcast.emit('recievePool', opponentPool)
            }
            socket.emit('turn', userTurn)
            socket.broadcast.emit('turn', opponentTurn)
        }*/
    })

    //TODO: очередность ходов
    socket.on('changeTurn', (socketId) => {
        let nextTurnUser = undefined

        // передаем ход следующему игроку, если массив окончен, начинаем сначала
        nextTurnUser = getNextUser()

        let turns = []
        let c = 0
        for (let user of dominoRoom) {
            console.log('sadsa' + user)
            if (user == nextTurnUser) {
                turns[c] = true
            } else turns[c] = false
            c++
        }
        let ind = 0
        for (let user of dominoRoom) {
            console.log('Отправляю юзеру ' + user + ' value: ' + turns[ind])
            io.to(user).emit('turn', turns[ind])
            ind++
        }
    })


    socket.on('getShopDomino', (sock) => {
        if (commonShopPool.length >= 1) {
            let shopDomino = commonShopPool[Math.round(getRandomValueBetween(0, commonShopPool.length - 1))] // получение случайной доминошки
            if (shopDomino.leftSide === 1 && shopDomino.rightSide === 1) {
                turn = sock.id
                sendTurn(sock.id)
            }
            console.log(commonShopPool.length)
            commonShopPool = commonShopPool.filter(e => e.leftSide != shopDomino.leftSide || e.rightSide != shopDomino.rightSide) // убираем выбранную доминошку из пула и выдаем ее клиенту
            console.log(commonShopPool.length)
            socket.emit('recieveShopDomino', shopDomino)
        } else {
            //experimental
            // если базар пуст, передаем ход следующему игроку
            turn = getNextUser()
            sendTurn(turn)

            socket.emit('recieveShopDomino', { message: 'Базар пуст' })
        }
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

        for (let i of dominoRoom) {
            io.to(i).emit('placeDomino', {
                rightSide: bone.rightSide,
                leftSide: bone.leftSide,
                first: true,
                target: boneTargetSide,
                reverse
            })
        }
    })
})

function getRandomValueBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomDomino() {
    let randValue = Math.round(getRandomValueBetween(0, dominoPool.length - 1))
    return dominoPool[randValue]
}

function existsInPool(pool, domino) {
    let exists = false
    for (let i = 0; i < pool.length; i++) {
        if (_.includes(pool[i], domino)) {
            exists = true
            break
        }
    }
    return exists
}

function getUserTurns(roomSize, pool) {
    let result = []
    let doublesArray = [
        [],
        [],
        [],
        []
    ]
    for (let i = 0; i < roomSize; i++) {
        pool[i].forEach(domino => {
            if (domino.leftSide === domino.rightSide && domino.leftSide !== 0) {
                doublesArray[i].push(domino.leftSide)
            }
        })
    }
    console.log(doublesArray)
    for (let i in doublesArray) {
        console.log('item: ' + i);
        if (Math.min(...doublesArray[i]) === 1) {
            result.push(true)
        } else result.push(false)
    }
    console.log('result ' + result)
    let minDomino = findMinDomino(result)
    console.log('minDomino: ' + minDomino)
    for (let i in result) {
        console.log('item: ' + result[i])
        if (result[i] == minDomino && isNumber(minDomino)) {
            result[i] = true
        } else result[i] = false
    }
    return result
}

function findMinDomino(pool) {
    let result = pool.filter(el => el !== false)
    return Math.min(...result)
}

function sendTurn(socketId) { // Отправка хода
    for (let user of dominoRoom) {
        if (!turn || turn === socketId) {
            io.to(user).emit('turn', true)
        } else io.to(user).emit('turn', false)
    }
}

function getNextUser() {
    let room = Array.from(dominoRoom)
    let nextIndex = room.indexOf(turn)
    if (nextIndex !== -1 && room[nextIndex + 1]) {
        return room[nextIndex + 1]
    } else return room[0]
}