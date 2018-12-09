import axios from 'axios'
import * as log from 'loglevel'
import storeMgr from './keydatabase.js'

const authServerURL = 'http://dkenna.com:8000'
const authChallengeURL = `${authServerURL}/get_auth_challenge`
const keyUpdateChallengeURL = `${authServerURL}/get_update_challenge`
const authLoginURL = `${authServerURL}/token_login`
const passphraseLoginURL = `${authServerURL}/plogin_`
// const keyUpdateURL = `${authServerURL}/update_pub_key`

log.setLevel('debug')

class AuthClient {
    constructor () {
        this.listener = null
        this.errors = []
        this.authenticated = false
        this.updateToken = null
        this.username = null
    }
    forget () {
        this.authenticated = false
        this.username = null
        this.log('user forgotten', 0)
    }
    setUsername (username) {
        this.username = username
    }
    log (msg, noListen = true, err = null) {
        log.log(msg)
        if (this.listener && !noListen) {
            this.listener.update(msg)
        }
    }
    inform (msg) {
        if (this.listener) {
            this.listener.update(msg)
        }
    }
    setListener (listener) {
        this.listener = listener
    }
    async updatePublicKey (publicKey) {
    }
    async pauthenticate (passphrase) {
        try {
            const data = JSON.stringify({passphrase: passphrase})
            const response = await axios({method: 'post',
                                    url: passphraseLoginURL,
                                    data: data})
            this.log(response.data)
            this.authenticated = true
            this.log(response.data.username)
            this.username = response.data.username
            // storeMgr.createKeys(this.username)
            this.log('authenticated', 0)
        } catch (err) {
            this.errors.push({'login': err})
            this.log('problem authentication with passphrase', 0)
            this.log(err)
        }
    }
    async authenticate () {
        const ch = await this.fetchAuthChallenge()
        const sigData = JSON.stringify({challenge: ch.data, username: this.username})
        const signed = await storeMgr.sign(sigData)
        this.log(signed)
        const data = JSON.stringify({username: this.username, signed_challenge: signed})
        await axios({method: 'post', url: authLoginURL, data: data, withCredentials: true})
        return true
    }
    fetchChallenge (url) {
        const pchallenge = axios.get(url)
        return pchallenge
    }
    fetchAuthChallenge () {
        return this.fetchChallenge(authChallengeURL)
    }
    fetchKeyUpdateChallenge () {
        return this.fetchChallenge(keyUpdateChallengeURL)
    }
}

export default AuthClient
