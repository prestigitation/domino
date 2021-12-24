const { isNumber } = require('lodash');
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
let standartPoolCount = 7 // предел максимального количество точек(-1) 
let commonDominoPool = [
    [],
    [],
    [],
    []
]
let commonShopPool = []
let dominoCountMap

let leftSide
let rightSide

let dominoRoom

let poolHasStartDouble
let turn // id сокета, который имеет право на ход. меняется по функции change turn и при инициализации стола

let fishPlayersCounter = 0
let fishPool

io.on("connect_error", (err) => { console.log(`connect_error due to ${err.message}`); });

io.on('connect', socket => {
    socket.on('checkAvaliablePlacement', obj => {
        if (!leftSide && !rightSide) {
            socket.emit('recieveAvaliablePlacement', {
                leftSide: false,
                rightSide: false,
                emptyField: true,
            })
            leftSide = obj.leftSide
            rightSide = obj.rightSide
        } else {
            socket.emit('recieveAvaliablePlacement', {
                leftSide: obj.leftSide == leftSide || obj.rightSide == leftSide,
                rightSide: obj.leftSide == rightSide || obj.rightSide == rightSide,
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
        fishPool = new Map()

        let dominoSequence = [...generateStartDominoSequence()]
            // массив из пар ключ значение, содержащий количество номиналов на столе 
            // (по умолчанию каждый номинал содержит 0 доминошек)
        dominoCountMap = new Map(dominoSequence)

        for (let j = 0; j < standartPoolCount; j++) {
            for (let t = j; t < standartPoolCount; t++) {
                if (!_.includes(dominoPool, new Domino(j, t)))
                    dominoPool.push(new Domino(j, t))
            }
        }

        let randomPool = _.chunk(_.shuffle(_.flattenDeep(dominoPool)), standartPoolCount)
        for (let i = 0; i < dominoRoom.size; i++) {
            commonDominoPool[i] = randomPool[i]
        }

        // в базар попадает то, что не вошло в пул игроков
        commonShopPool = _.difference(dominoPool, _.flattenDeep(commonDominoPool))

        console.log('SHOP LENGTH: ' + commonShopPool.length)
        let usersPoolIndex = 0

        let userTurns = getUserTurns(dominoRoom.size, commonDominoPool)
        console.log('turns: ' + userTurns)
        poolHasStartDouble = userTurns.filter(el => el === true).length === 1

        if (poolHasStartDouble) {
            usersPoolIndex = userTurns.indexOf(true)
        }
        let a = 0
        if (dominoRoom.size >= 2) {
            for (let i of dominoRoom) {
                io.to(i).emit('recievePool', commonDominoPool[a])

                if (poolHasStartDouble) {
                    console.log('sended to : ' + i + ' ' + userTurns[usersPoolIndex])
                    io.to(i).emit('turn', userTurns[a])
                    if (userTurns[usersPoolIndex]) {
                        turn = Array.from(dominoRoom)[usersPoolIndex]
                    }
                }
                usersPoolIndex++
                a++
            }
        }
    })

    socket.on('changeTurn', () => {
        let nextTurnUser = undefined
            // передаем ход следующему игроку, если массив окончен, начинаем сначала
        nextTurnUser = getNextUser()

        let turns = []
        let c = 0
        for (let user of dominoRoom) {
            if (user == nextTurnUser) {
                turns[c] = true
            } else turns[c] = false
            c++
        }
        let index = 0
        for (let user of dominoRoom) {
            console.log('Отправляю юзеру ' + user + ' value: ' + turns[index])
            io.to(user).emit('turn', turns[index])
            index++
        }
        turn = nextTurnUser
    })


    socket.on('getShopDomino', (sock) => {
        if (commonShopPool.length >= 1) {
            let shopDomino = commonShopPool[Math.round(getRandomValueBetween(0, commonShopPool.length - 1))] // получение случайной доминошки
            if (shopDomino.leftSide === 1 && shopDomino.rightSide === 1 && !turn) {
                turn = sock.id
                sendTurn(turn)
            }
            console.log(commonShopPool.length)
            commonShopPool = commonShopPool.filter(e => e.leftSide != shopDomino.leftSide || e.rightSide != shopDomino.rightSide) // убираем выбранную доминошку из пула и выдаем ее клиенту
            console.log(commonShopPool.length)
            socket.emit('recieveShopDomino', shopDomino)
        } else {
            turn = getNextUser()
            sendTurn(turn)
            socket.emit('recieveShopDomino', { message: 'Базар пуст' })
        }
    })

    socket.on('checkForFish', (domino) => {
        //проверка условия рыбы
        if ((dominoCountMap.get(domino.rightSide) == standartPoolCount ||
                dominoCountMap.get(domino.leftSide) == standartPoolCount) &&
            leftSide == rightSide) {
            socket.emit('requestFish', dominoCountMap)
        }
    })

    socket.on('changeQuantity', (domino) => {
        let localRightSide = domino.rightSide
        let localLeftSide = domino.leftSide
        if (localRightSide != localLeftSide) {
            dominoCountMap.set(localRightSide, dominoCountMap.get(localRightSide) + 1)
        } // если выбранное домино - дубль, тогда увеличиваем счетчик только 1 раз
        //увеличиваем количество повторений домино, с которым работаем
        dominoCountMap.set(localLeftSide, dominoCountMap.get(localLeftSide) + 1)
    })

    socket.on('gameOver', () => {
        // отсылаем проигравшему сообщение о проигрыше
        socket.broadcast.emit('gameOver')
    })

    socket.on('getFish', (player) => {
        fishPlayersCounter++
        fishPool.set(player.socket, parsePoolScore(player.pool)) // записываем пул 
        if (fishPlayersCounter === dominoRoom.size) {
            socket.emit('recieveFish', [...fishPool.entries()])
            socket.broadcast.emit('recieveFish', [...fishPool.entries()])
                //io.sockets.send('recieveFish', fishPool)
        }
    })

    socket.on('attemptDominoPlace', domino => {
        let bone = JSON.parse(domino.domino)
        let boneTargetSide = domino.targetSide
        let reverse // будет ли доминошка реверснута
        if (boneTargetSide == 'right') {
            if (bone.rightSide == rightSide) {
                reverse = true
                rightSide = bone.leftSide
            } else rightSide = bone.rightSide
        } else if (boneTargetSide == 'left') {
            if (bone.leftSide == leftSide) {
                reverse = true
                leftSide = bone.rightSide
            } else leftSide = bone.leftSide
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
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
    for (let i in doublesArray) {
        if (Math.min(...doublesArray[i]) === 1) {
            result.push(true)
        } else result.push(false)
    }
    let minDomino = findMinDomino(result)
    for (let i in result) {
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
    //let nextUser = getNextUser()
    for (let user of dominoRoom) {
        if (socketId == user)
            io.to(socketId).emit('turn', true)
        else
            io.to(user).emit('turn', false)
    }
}

function getNextUser() {
    let room = Array.from(dominoRoom)
    let nextIndex = room.indexOf(turn)
    if (nextIndex !== -1 && room[nextIndex + 1]) {
        return room[nextIndex + 1]
    } else return room[0]
}

function parsePoolScore(pool) {
    let sum = 0
    for (let i in pool) {
        sum += pool[i].rightSide + pool[i].leftSide
    }
    return sum
}

function* generateStartDominoSequence() {
    for (let i = 0; i < standartPoolCount; i++) {
        yield [i, 0]
    }
}