module.exports = class Domino {
    _image = null
    pathToImages = './images/'
    constructor(leftSide, rightSide) {
        this.leftSide = leftSide
        this.rightSide = rightSide
        this._image = this.pathToImages + this.leftSide + this.rightSide + '.png'
    }
}