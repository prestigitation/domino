const dominoWidth = 150 // длина доминошки
const dominoHeight = 50

const socket = io("ws://localhost:3000", { forceNew: true });

socket.on('connect', (sock) => {
    socket.emit('joinRoom', 'domino')
    console.log('joined domino')
})

socket.on('recieveAvaliablePlacement', (places) => {
    console.log(places)
    if (places.emptyField) {
        let field = document.getElementById('domino_field')
        console.log(field.offsetHeight)
        createAvaliableDomino(field.offsetWidth / 2 - dominoWidth / 2, field.offsetHeight / 6)
    }
})

socket.on('recievePool', (pool) => {
    let userDominoContainer = document.getElementById('user_domino_container')
    let opponentDominoContainer = document.getElementById('opponent_user_domino_container')
    for (let i in pool) {
        let userDomino = document.createElement('img')
        userDomino.classList.add('user_domino')
        userDomino.leftSide = pool[i].leftSide
        userDomino.rightSide = pool[i].rightSide
        userDomino.src = pool[i]._image
        userDominoContainer.appendChild(userDomino)

        let opponentDomino = document.createElement('img')
        opponentDomino.classList.add('user_domino')
        opponentDomino.src = pool[0]._image
        opponentDominoContainer.appendChild(opponentDomino)
    }
})

window.onload = function() {
    document.getElementById('user_domino_container').addEventListener('click', function(e) {
        if (e.target.parentElement.id == 'user_domino_container') {
            // если мы кликнули на блок, где находятся пользовательские домино и выбрали именно доминошку
            // const targetElement = e.target
            socket.emit('checkAvaliablePlacement', {
                leftSide: e.target.leftSide,
                rightSide: e.target.rightSide
            })
        }
    })
}

function createAvaliableDomino(offsetWidth, offsetHeight) {
    let field = document.getElementById('domino_field')
    let avaliableDomino = document.createElement('div')
    avaliableDomino.style.marginTop = offsetHeight + 'px'
    avaliableDomino.style.marginLeft = offsetWidth + 'px'
    avaliableDomino.style.width = dominoWidth + 'px'
    avaliableDomino.style.height = dominoHeight + 'px'
    avaliableDomino.classList.add('avaliable_domino')
    field.append(avaliableDomino)
}