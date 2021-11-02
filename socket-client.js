const dominoWidth = 150
const dominoHeight = 50

let wasAvaliableDominoShowed = false
let leftSide = undefined // представляет собой числовое значение домино, оказавшееся скраю выбранного угла
let rightSide = undefined

const socket = io("ws://localhost:3000", { forceNew: true });

socket.on('connect', (sock) => {
    socket.emit('joinRoom', 'domino')
})


socket.on('recieveAvaliablePlacement', (places) => {
    console.log(places)
    let field = document.getElementById('field_container')
    createAvaliableDomino(field.offsetWidth / 2 - dominoWidth / 2, field.offsetHeight / 6, places.emptyField ? true : false, places.leftSide, places.rightSide)
})

socket.on('recievePool', pool => {
    let userDominoContainer = document.getElementById('user_domino_container')
        //let opponentDominoContainer = document.getElementById('opponent_user_domino_container')
    for (let i in pool) {
        let userDomino = document.createElement('img')
        userDomino.classList.add('user_domino')
        userDomino.leftSide = pool[i].leftSide
        userDomino.rightSide = pool[i].rightSide
        userDomino.src = pool[i]._image
        userDominoContainer.appendChild(userDomino)

        /*let opponentDomino = document.createElement('img')
        opponentDomino.classList.add('user_domino')
        opponentDomino.src = pool[0]._image
        opponentDominoContainer.appendChild(opponentDomino)*/
    }
})


socket.on('placeDomino', domino => {
    console.log('conn')
    let field = document.getElementById('field_container')
    let selectedDomino = Array
        .from(document.getElementById('user_domino_container').childNodes)
        .filter(e => e.rightSide == domino.rightSide && e.leftSide == domino.leftSide)[0] // нахождение доминошки, пришедшей с сервера
    if (!selectedDomino) {
        let userDomino = document.createElement('img')
        userDomino.classList.add('user_domino')
        userDomino.leftSide = domino.leftSide
        userDomino.rightSide = domino.rightSide
        userDomino.src = `./images/${userDomino.leftSide}${userDomino.rightSide}.jpg`
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

    // если доминошку поставить вправо, делаем prepend, т.е вставляем перед нужным узлом
    // влево идет просто append
    if (domino.reverse) {
        selectedDomino.style.transform = "rotate(180deg)"
    }

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
            console.log(targetSide)
            socket.emit('attemptDominoPlace', {
                domino: localStorage.getItem('currentSelectedDomino'),
                leftFieldSide: leftSide,
                rightFieldSide: rightSide,
                targetSide
            })
        }
    })
}

function createAvaliableDomino(offsetWidth, offsetHeight, emptyField, leftSide, rightSide) { // Добавить проверку left i right
    let field = document.getElementById('field_container')
    let avaliableDomino = document.createElement('div')
    console.log(emptyField)
    if (emptyField) {

        avaliableDomino.style.marginTop = offsetHeight + 'px'
        avaliableDomino.style.width = dominoWidth + 'px'
        avaliableDomino.style.height = dominoHeight + 'px'
        avaliableDomino.classList.add('avaliable_domino')

        field.append(avaliableDomino)

        wasAvaliableDominoShowed = true
    } else if (!emptyField) {
        // TODO: refactor
        if (leftSide) {
            let leftAvaliableDomino = document.createElement('div')
            leftAvaliableDomino.style.width = dominoWidth + 'px'
            leftAvaliableDomino.style.height = dominoHeight + 'px'
            leftAvaliableDomino.classList.add('avaliable_domino')
            leftAvaliableDomino.classList.add('left_avaliable_domino')
            field.insertBefore(leftAvaliableDomino, field.firstChild)
        }
        if (rightSide) {
            let rightAvaliableDomino = document.createElement('div')
            rightAvaliableDomino.style.width = dominoWidth + 'px'
            rightAvaliableDomino.style.height = dominoHeight + 'px'
            rightAvaliableDomino.classList.add('right_avaliable_domino')
            rightAvaliableDomino.classList.add('avaliable_domino')

            field.append(rightAvaliableDomino)
        }
    }
}