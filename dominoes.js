let pathToImages = './images/'
module.exports = class Domino {
    _image = null
    constructor(leftSide, rightSide) {
        this.leftSide = leftSide
        this.rightSide = rightSide
        this._image = pathToImages + this.leftSide + this.rightSide + '.png'
    }
}