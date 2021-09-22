const socket = io("ws://localhost:3000", { forceNew: true });

socket.on('connect', (sock) => {
    socket.emit('joinRoom', 'domino')
    console.log('joined domino')
})

socket.on('recievePool', (pool) => {
    console.log(pool)
    let userDominoContainer = document.getElementById('user_domino_container')
    let opponentDominoContainer = document.getElementById('opponent_user_domino_container')
    for (let i in pool) {
        let userDomino = document.createElement('img')
        userDomino.classList.add('user_domino')
        userDomino.src = pool[i]._image
        userDominoContainer.appendChild(userDomino)

        let opponentDomino = document.createElement('img')
        opponentDomino.classList.add('user_domino')
        opponentDomino.src = pool[0]._image
        opponentDominoContainer.appendChild(opponentDomino)
    }
})