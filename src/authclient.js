import axios from 'axios'
import * as log from 'loglevel'
import storeMgr from './keydatabase.js'
// import * as canonicalize from 'canonical-json'

const authServerURL = 'http://dkenna.com:8000'
const authChallengeURL = `${authServerURL}/get_auth_challenge`
const keyUpdateChallengeURL = `${authServerURL}/get_update_challenge`
const authLoginURL = `${authServerURL}/token_login`
const passphraseLoginURL = `${authServerURL}/plogin_`
const jwksURL = `${authServerURL}/get_jwks`
const pemURL = `${authServerURL}/get_pem`
// const keyUpdateURL = `${authServerURL}/update_pub_key`

log.setLevel('debug')

class AuthClient {
    constructor () {
        this.listener = null
        this.errors = []
        this.authenticated = false
        this.updateToken = null
        this.username = null
        this.id_token = null
        // this.log(canonicalize('{"a":"b"}'))
    }
    forget () {
        this.authenticated = false
        this.username = null
        this.id_token = null
        this.log('user forgotten', 0)
        storeMgr.forget()
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
    handleError (category, msg, err) {
        this.errors.push({category: err})
        this.log(msg, 0)
        this.log(err)
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
            const encPass = await this.encryptPassphrase(passphrase)
            log.log('encrypted passphrase (hex): ' + encPass)
            const data = JSON.stringify({passphrase: encPass})
            const response = await axios({method: 'post',
                                    url: passphraseLoginURL,
                                    data: data})
            this.log(response.data)
            this.authenticated = true
            this.log(response.data.username)
            this.username = response.data.username
            this.id_token = response.data.id_token
            this.log('authenticated', 0)
            storeMgr.createKeys(this.username)
            this.log('created keys', 0)
        } catch (err) {
            this.handleError('login', 'problem authentication with passphrase', err)
            throw err
        } finally {
            this.passphrase = null
        }
    }
    async encryptPassphrase (passphrase) {
        /* fetch the server key and encrypt the
            passphrase */
        try {
            const keys = await this.fetchJWKS()
            const key = keys.data.keys[0]
            const pub = await storeMgr.importPubKey(key)
            let hash = await storeMgr.hash(passphrase)
            let hexHash = storeMgr.buf2hex(hash)
            this.log('passphrase hash:' + hexHash)
            const enc = await storeMgr.encryptAsym(pub, hash)
            return storeMgr.buf2hex(enc)
        } catch (err) {
            this.handleError('encrypt', '', err)
            throw err
        }
    }
    fetchJWKS () {
        const keys = axios.get(jwksURL)
        return keys
    }
    fetchPEM () {
        const key = axios.get(pemURL)
        return key
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
