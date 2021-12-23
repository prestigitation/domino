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

//TODO: Обработать рыбу

let fieldPool = [] // Общий пул, используемый на столе при выставлении домино

let dominoRoom

let poolHasStartDouble
let turn // id сокета, который имеет право на ход. меняется по функции change turn и при инициализации стола


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

        let randomPool = _.chunk(_.shuffle(_.flattenDeep(dominoPool)), standartPoolCount)
        for (let i = 0; i < dominoRoom.size; i++) {
            let pool = []
                /*for (let k = 0; k < standartPoolCount; k++) {
                    let selectedDomino
                    do {
                        selectedDomino = getRandomDomino()
                    } while (_.includes(_.flattenDeep(commonDominoPool), selectedDomino))
                    pool.push(selectedDomino)
                }*/

            // ПЕРЕТАСОВАТЬ flattenDeep МАССИВ, ПОТОМ СДЕЛАТЬ ЧАНК ПО КОЛИЧЕСТВУ СИМВОЛОВ
            commonDominoPool[i] = randomPool[i]
        }

        console.log('0 CLIENT -=----------------------')
        console.log(commonDominoPool[0])
        console.log('1 CLIENT -=----------------------')
        console.log(commonDominoPool[1])
        console.log('2 CLIENT -=----------------------')
        console.log(commonDominoPool[2])
        console.log('3 CLIENT -=----------------------')
        console.log(commonDominoPool[3])

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

    socket.on('changeTurn', (socketId) => {
        let nextTurnUser = undefined

        // передаем ход следующему игроку, если массив окончен, начинаем сначала
        nextTurnUser = getNextUser()

        console.log('current: ' + turn)
        console.log('next: ' + nextTurnUser)
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
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDomino() {
    let randValue = getRandomValueBetween(0, dominoPool.length - 1)
    return dominoPool[randValue]
        /*
        let randValue = getRandomValueBetween(0, dominoPool.length - 1)
        if (!_.includes(_.flattenDeep(commonDominoPool), dominoPool[randValue])) {
            return dominoPool[randValue]
        } else {
            do {
                randValue = getRandomValueBetween(0, dominoPool.length - 1)
            } while (_.includes(_.flattenDeep(commonDominoPool), dominoPool[randValue]))
            return dominoPool[randValue]
        }*/
}

function existsInPool(pool, domino) {
    /*let exists = false
    if (_.includes(pool, domino)) exists = true
    return exists*/
    /*return _.some(pool[0], { leftSide: domino.leftSide, rightSide: domino.rightSide }) ||
        _.some(pool[1], { leftSide: domino.leftSide, rightSide: domino.rightSide }) ||
        _.some(pool[2], { leftSide: domino.leftSide, rightSide: domino.rightSide }) ||
        _.some(pool[3], { leftSide: domino.leftSide, rightSide: domino.rightSide })*/
    return _.includes(_.flattenDeep(pool), domino)

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