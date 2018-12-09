class Listener {
    constructor (outputter) {
        this.outputter = outputter
    }
    update (msg) {
        this.outputter(msg)
    }
}
export default Listener
