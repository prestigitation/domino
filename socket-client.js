const dominoWidth = 150
const dominoHeight = 50

let wasAvaliableDominoShowed = false
let leftSide = undefined // представляет собой числовое значение домино, оказавшееся скраю выбранного угла
let rightSide = undefined

let turn = undefined


const socket = io("http://127.0.0.1:3000", { forceNew: true, withCredentials: false });

socket.on('connect', () => {
    socket.emit('joinRoom', 'domino')
})


socket.on('recieveAvaliablePlacement', (places) => {
    console.log(places)
    let field = document.getElementById('field_container')
        // удаляем все avaliable ноды, до отрисовки, чтоб исключить дубликаты
    let rightDuplicateDomino = field.querySelectorAll('.right_avaliable_domino')
    let leftDuplicateDomino = field.querySelectorAll('.left_avaliable_domino')
    let firstAvaliableDomino = field.querySelectorAll('.avaliable_domino')
    console.log(firstAvaliableDomino)
    if ((rightDuplicateDomino || leftDuplicateDomino) && !places.emptyField) {
        for (let elem of rightDuplicateDomino) {
            field.removeChild(elem)
        }
        for (let elem of leftDuplicateDomino) {
            field.removeChild(elem)
        }
    }

    createAvaliableDomino(!!places.emptyField, places.leftSide, places.rightSide)
})

socket.on('recievePool', pool => {
    let userDominoContainer = document.getElementById('user_domino_container')
    for (let i in pool) {
        let userDomino = document.createElement('img')
        userDomino.classList.add('user_domino')
        userDomino.leftSide = pool[i].leftSide
        userDomino.rightSide = pool[i].rightSide
        userDomino.src = pool[i]._image
        userDominoContainer.appendChild(userDomino)
    }
})

socket.on('turn', (value) => {
    if (value) {
        turn = true
        document.getElementById('turn').innerHTML =
            `
        <span class="turn_text turn_player">
            Ваш ход!
        </span>
        `
    } else {
        turn = false
        document.getElementById('turn').innerHTML =
            `
        <span class="turn_text turn_opponent">
            Сейчас ход противника
        </span>
        `
    }
})


socket.on('placeDomino', domino => {
    let field = document.getElementById('field_container')
    let selectedDomino = Array
        .from(document.getElementById('user_domino_container').childNodes)
        .filter(e => e.rightSide == domino.rightSide && e.leftSide == domino.leftSide)[0] // нахождение доминошки, пришедшей с сервера
    if (!selectedDomino) {
        let userDomino = document.createElement('img')
        userDomino.classList.add('user_domino')
        userDomino.leftSide = domino.leftSide
        userDomino.rightSide = domino.rightSide
        userDomino.src = `./images/${userDomino.leftSide}${userDomino.rightSide}.png`
        selectedDomino = userDomino
        document.getElementById('user_domino_container').appendChild(userDomino)
    } else {}
    if (domino.first) {
        removeAvaliableDomino(0)
        removeAvaliableDomino(1)
    }
    if (domino.reverse) {
        //transform: rotateX(180deg);
        selectedDomino.style.transform = "rotate(180deg)"
    }

    // если доминошку поставить вправо, делаем prepend, т.е вставляем перед нужным узлом
    // влево идет просто append
    if (!domino.target || domino.target == 'right' && selectedDomino) {
        field.appendChild(selectedDomino)
    } else if (domino.target && domino.target == 'left' && selectedDomino) {
        field.prepend(selectedDomino)
    }

    socket.emit('changeTurn')

    if (!document.getElementById('user_domino_container').getElementsByClassName('user_domino').length) {
        socket.emit('gameOver')
        alert('Вы выиграли')
    }
})

socket.on('gameOver', () => {
    alert('К сожалению, вы проиграли :(')
})

socket.on('recieveShopDomino', (domino) => {
    let message = domino.message
    if (message) {
        alert(message)
    } else {
        let userDominoContainer = document.getElementById('user_domino_container')
        let userDomino = document.createElement('img')
        userDomino.classList.add('user_domino')
        userDomino.leftSide = domino.leftSide
        userDomino.rightSide = domino.rightSide
        userDomino.src = domino._image
        userDominoContainer.appendChild(userDomino)
    }
})

window.onload = function() {

    document.getElementById('shop_button').addEventListener('click', function(e) {
        socket.emit('getShopDomino')
    })

    document.getElementById('user_domino_container').addEventListener('click', function(e) {
        console.log(turn)
        if (e.target.parentElement.id == 'user_domino_container' && turn) {
            // если мы кликнули на блок, где находятся пользовательские домино и выбрали именно доминошку
            const targetElement = {
                leftSide: e.target.leftSide,
                rightSide: e.target.rightSide
            }
            localStorage.setItem('currentSelectedDomino', JSON.stringify(targetElement))
            socket.emit('checkAvaliablePlacement', {
                leftSide: targetElement.leftSide,
                rightSide: targetElement.rightSide
                    /* В targetElement LEFT SIDE означает левый и правый край костяшки домино, 
                    а leftSide и rightSide - Значение на краях доски!!*/
            })
        }
    })

    document.getElementById('field_container').addEventListener('click', function(e) {
        if (e.target.classList.contains('avaliable_domino') && turn) {
            let targetSide // в какую сторону мы ставим домино
            if (e.target.classList.contains('right_avaliable_domino')) {
                targetSide = 'right'
            } else if (e.target.classList.contains('left_avaliable_domino')) {
                targetSide = 'left'
            }

            let currentSelectedDomino = localStorage.getItem('currentSelectedDomino')
            socket.emit('attemptDominoPlace', {
                domino: currentSelectedDomino,
                leftFieldSide: JSON.parse(currentSelectedDomino).leftSide,
                rightFieldSide: JSON.parse(currentSelectedDomino).rightSide,
                targetSide
            })
        }
    })
}

function createAvaliableDomino(emptyField, leftSide, rightSide) { // Добавить проверку left i right
    let field = document.getElementById('field_container')
    let avaliableDomino = document.createElement('div')
    if (turn) {
        if (emptyField) {
            avaliableDomino.style.width = dominoWidth + 'px'
            avaliableDomino.style.height = dominoHeight + 'px'
            avaliableDomino.classList.add('avaliable_domino')
            field.append(avaliableDomino)
            wasAvaliableDominoShowed = true
        } else if (!emptyField && (rightSide || leftSide)) {
            setAvaliableDominoPlacement(leftSide, rightSide)
        }
    }
}

function setAvaliableDominoPlacement(leftSide, rightSide) {
    if (turn) {
        let field = document.getElementById('field_container')
        if (leftSide) {
            let leftAvaliableDomino = renderAvaliableDomino('left')
            field.insertBefore(leftAvaliableDomino, field.firstChild)
        }
        if (rightSide) {
            let rightAvaliableDomino = renderAvaliableDomino('right')
            field.append(rightAvaliableDomino)
        }
    }
}

function renderAvaliableDomino(target) {
    let newAvaliableDomino = document.createElement('div')
    newAvaliableDomino.style.width = dominoWidth + 'px'
    newAvaliableDomino.style.height = dominoHeight + 'px'
    newAvaliableDomino.classList.add('avaliable_domino')
    newAvaliableDomino.classList.add(target + '_avaliable_domino')
    return newAvaliableDomino
}

function removeAvaliableDomino(index) {
    let field = document.getElementById('field_container')
    let avaliableDomino = document.getElementsByClassName('avaliable_domino')[index]
    if (avaliableDomino) {
        field.removeChild(avaliableDomino)
    }
}