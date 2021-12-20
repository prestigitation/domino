const dominoWidth = 150
const dominoHeight = 50

let wasAvaliableDominoShowed = false
let leftSide = undefined // представляет собой числовое значение домино, оказавшееся скраю выбранного угла
let rightSide = undefined

let leftDominoCount = 0
let rightDominoCount = 0

let leftBottomIndex = 0
let rightBottomIndex = 0

let standartPoolCount = 4

let leftCountIndex = 0
let rightCountIndex = 0

let turn = undefined

//TODO: drag-n-drop
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

    if ((rightDuplicateDomino || leftDuplicateDomino) && !places.emptyField) {
        for (let elem of rightDuplicateDomino) {
            field.removeChild(elem)
        }
        for (let elem of leftDuplicateDomino) {
            field.removeChild(elem)
        }
    }

    createAvaliableDomino(places.emptyField, places.leftSide, places.rightSide)
})

socket.on('recievePool', pool => {
    console.log('поулчил пул')
    console.log(pool)

    let userDominoContainer = document.getElementById('user_domino_container')
    userDominoContainer.innerHTML = ''
    let shop = document.createElement('button')
    shop.id = 'shop_button'
    shop.innerText = 'Базар'
    shop.addEventListener('click', () => {
        socket.emit('getShopDomino', socket.id)
    })
    userDominoContainer.appendChild(shop)
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
    let turnHtml
    if (value) {
        turn = true
        turnHtml = `
            <span class="turn_text turn_player">
                Сейчас ваш ход!
            </span>
            `
    } else {
        turn = false
        turnHtml = `
                <span class="turn_text turn_opponent">
                    Сейчас ход противника
                </span>
                `
    }
    createTurnNode(turnHtml)
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
        let userDominoContainer = document.getElementById('user_domino_container')
        userDominoContainer.appendChild(userDomino)
    }
    removeAvaliableDomino()
    removeAvaliableDomino()

    let sideTarget
    let sideCounter
    if (domino.target == 'right') {
        sideTarget = rightDominoCount
        sideCounter = rightCountIndex
        bottomCounter = rightBottomIndex

    } else if (domino.target == 'left') {
        sideTarget = leftDominoCount
        sideCounter = leftCountIndex
        bottomCounter = leftBottomIndex
    }

    let formula = ((150 * sideCounter) + 50)

    if (sideTarget >= standartPoolCount && sideTarget < standartPoolCount + 3) {
        if (sideTarget == standartPoolCount) { // standartPoolCount
            selectedDomino.style.marginLeft = '-50px'
            selectedDomino.style.marginRight = '-50px'
        } else {
            if (domino.target == 'left') {
                selectedDomino.style.marginLeft = '100px'
                selectedDomino.style.marginRight = '-100px'
            } else if (domino.target == 'right') {
                if (sideTarget > standartPoolCount + 1) {
                    selectedDomino.style.marginLeft = '-250px'
                    selectedDomino.style.marginRight = '100px'
                } else {
                    selectedDomino.style.marginLeft = '-100px'
                    selectedDomino.style.marginRight = '100px'
                }
            }
        }
        selectedDomino.style.marginTop = formula + 'px'
        if (domino.reverse) {
            selectedDomino.style.transform = 'rotate(270deg)'
        } else selectedDomino.style.transform = 'rotate(90deg)'
        if (domino.target == 'left') {
            leftCountIndex++
        } else if (domino.target == 'right') {
            rightCountIndex++
        }
    }
    if (sideTarget >= standartPoolCount + 3) { // standartPoolCount
        if (domino.target == 'right') {
            selectedDomino.style.marginTop = 150 * (standartPoolCount / 2) + 75 + 'px' //'300px'
            if (sideTarget == standartPoolCount * 2) {
                selectedDomino.style.marginLeft = '-300px'
                selectedDomino.style.marginRight = '-300px'
            } else {
                if (rightBottomIndex > 1) {
                    selectedDomino.style.marginLeft = '-300px'
                } else selectedDomino.style.marginLeft = '-300px'
            }
            if (domino.reverse) {
                selectedDomino.style.transform = 'rotate(360deg)'
            }
            rightCountIndex++
            rightBottomIndex++
        } else if (domino.target == 'left') {
            selectedDomino.style.marginTop = '300px'
            if (sideTarget == standartPoolCount * 2) {
                selectedDomino.style.marginLeft = '-300px'
                selectedDomino.style.marginRight = '-300px'
            } else {
                if (leftBottomIndex > 1) {
                    selectedDomino.style.marginRight = '-300px'
                } else selectedDomino.style.marginRight = '0px'
            }
            if (domino.reverse) {
                selectedDomino.style.transform += `rotate(180deg)`
            } else selectedDomino.style.transform += `rotate(0deg)`
            leftCountIndex++
            leftBottomIndex++
        }
    }
    // если не зашли в диапазон выше, проверяем на обычный reverse и инвертируем изображение
    if (!selectedDomino.style.transform && domino.reverse) {
        selectedDomino.style.transform = "rotate(180deg)"
    }

    // если доминошку поставить вправо, делаем prepend, т.е вставляем перед нужным узлом
    // влево идет просто append
    if (!domino.target || domino.target == 'right' && selectedDomino) {
        field.appendChild(selectedDomino)
    } else if (domino.target && domino.target == 'left' && selectedDomino) {
        field.prepend(selectedDomino)
    }

    if (turn) {
        socket.emit('changeTurn', socket.id)
        turn = false
    }

    if (domino.target == 'right') {
        rightDominoCount++
    } else if (domino.target == 'left') {
        leftDominoCount++
    }


    if (!document.getElementById('user_domino_container').getElementsByClassName('user_domino').length) {
        alert('Вы выиграли')
        socket.emit('gameOver')

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
    if (turn || turn === undefined) {
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

function removeAvaliableDomino() {
    let field = document.getElementById('field_container')
    let avaliableDomino = document.getElementsByClassName('avaliable_domino')
    for (let i = 0; i < avaliableDomino.length; i++) {
        field.removeChild(avaliableDomino[i])
    }
}

function createTurnNode(innerHtml) {
    let container = document.getElementById('user_domino_container')
    let turnNode = container.querySelector('#turn')
    if (!turnNode) {
        let turnNode = document.createElement('div')
        turnNode.id = 'turn'
        turnNode.innerHTML = innerHtml
        container.prepend(turnNode)
    } else {
        turnNode.innerHTML = innerHtml
    }
}

function getDominoMargins(target, domino) {
    let sideTarget
    let sideCounter
    let formula = ((150 * sideCounter) + 50)

    let top
    let left
    let right

    if (target == 'right') {
        sideTarget = rightDominoCount
        sideCounter = rightCountIndex
        bottomCounter = rightBottomIndex

    } else if (target == 'left') {
        sideTarget = leftDominoCount
        sideCounter = leftCountIndex
        bottomCounter = leftBottomIndex
    }
    if (sideTarget >= standartPoolCount && sideTarget < standartPoolCount + 3) {
        //newAvaliableDomino.style.transform = `rotate(270deg)`

        if (sideTarget == standartPoolCount) { // standartPoolCount
            left = '-50px'
            right = '-50px'
        } else {
            if (target == 'left') {
                left = '100px'
                right = '-100px'
            } else if (target == 'right') {
                if (sideTarget > standartPoolCount + 1) {
                    left = '-250px'
                    right = '100px'
                } else {
                    left = '-100px'
                    right = '100px'
                }
            }
        }
        top = formula + 'px'
            //newAvaliableDomino.style.transform = 'rotate(90deg)'
    } else if (sideTarget >= standartPoolCount + 3) { // standartPoolCount
        if (target == 'right') {
            top = 150 * (standartPoolCount / 2) + 75 + 'px'
            if (sideTarget == standartPoolCount * 2) {
                left = '-300px'
                right = '-300px'
            } else {
                if (rightBottomIndex > 1) {
                    left = '-300px'
                } else newAvaliableDomino.style.marginLeft = '-300px'
            }
        } else if (target == 'left') {
            newAvaliableDomino.style.marginTop = '300px'
            if (sideTarget == standartPoolCount * 2) {
                left = '-300px'
                right = '-300px'
            } else {
                if (leftBottomIndex > 1) {
                    right = '-300px'
                } else right = '0px'
            }
        }
    }

    return { top, left, right }
}