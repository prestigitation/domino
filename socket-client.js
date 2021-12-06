const dominoWidth = 150
const dominoHeight = 50

let wasAvaliableDominoShowed = false
let leftSide = undefined // представляет собой числовое значение домино, оказавшееся скраю выбранного угла
let rightSide = undefined

const socket = io("ws://localhost:3000", { forceNew: true });

socket.on('connect', () => {
    socket.emit('joinRoom', 'domino')
})


socket.on('recieveAvaliablePlacement', (places) => {
    console.log(places)
    let field = document.getElementById('field_container')
    createAvaliableDomino(places.emptyField ? true : false, places.leftSide, places.rightSide)
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


socket.on('placeDomino', domino => {
    console.log(domino)
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
        let avaliableDomino = document.getElementsByClassName('avaliable_domino')[0]
        let secondAvaliableDomino = document.getElementsByClassName('avaliable_domino')[1]
        if (avaliableDomino) {
            field.removeChild(avaliableDomino)
        }
        if (secondAvaliableDomino) {
            field.removeChild(secondAvaliableDomino)
        }
    }
    if (domino.reverse) {
        selectedDomino.style.transform = "rotate(180deg)"
    }

    // если доминошку поставить вправо, делаем prepend, т.е вставляем перед нужным узлом
    // влево идет просто append
    if (!domino.target || domino.target == 'right' && selectedDomino) {
        field.appendChild(selectedDomino)
    } else if (domino.target && domino.target == 'left' && selectedDomino) {
        field.prepend(selectedDomino)
    }

    if (!document.getElementById('user_domino_container').getElementsByClassName('user_domino').length) {
        alert('Вы выиграли')
    }
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
        if (e.target.parentElement.id == 'user_domino_container') {
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
        if (e.target.classList.contains('avaliable_domino')) {
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
    console.log(emptyField, leftSide, rightSide)
    let field = document.getElementById('field_container')
    let avaliableDomino = document.createElement('div')
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

function setAvaliableDominoPlacement(leftSide, rightSide) {
    let field = document.getElementById('field_container')
    console.log(leftSide, rightSide)
    if (leftSide) {
        let leftAvaliableDomino = renderAvaliableDomino('left')
        field.insertBefore(leftAvaliableDomino, field.firstChild)
    }
    if (rightSide) {
        let rightAvaliableDomino = renderAvaliableDomino('right')
        field.append(rightAvaliableDomino)
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