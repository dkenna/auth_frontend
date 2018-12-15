import Dexie from 'dexie'
import * as log from 'loglevel'

log.setLevel('debug')

const defaultModulusLength = 2048
const defaultAlgo = 'RSASSA-PKCS1-v1_5'
const defaultHash = 'SHA-256'

class KeyStoreManager {
    constructor () {
        this.db = null
        this.errors = []
        this.createDB()
    }
    log (msg) {
        log.log(msg)
    }

    createDB () {
        this.db = new Dexie('keystore')
        this.db.version(1).stores({
            keystore: '++id,username,priv_key,pub_key,date'
        })
    }
    async forget () {
        if (this.db) {
            await this.db.delete()
            this.createDB()
        }
    }
    buf2hex (buf) {
        return Array.prototype.map.call(new Uint8Array(buf),
            x => (('00' + x.toString(16)).slice(-2))).join('')
    }

    arrayBufferToString (buffer) {
        var binary = ''
        var bytes = new Uint8Array(buffer)
        var len = bytes.byteLength
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return binary
    }

    formatAsPem (str) {
        var finalString = '-----BEGIN PUBLIC KEY-----\n'
        while (str.length > 0) {
            finalString += str.substring(0, 64) + '\n'
            str = str.substring(64)
        }
        finalString = finalString + '-----END PUBLIC KEY-----'
        return finalString
    }

    spkiToPEM (keydata) {
        var keydataS = this.arrayBufferToString(keydata)
        var keydataB64 = window.btoa(keydataS)
        var keydataB64Pem = this.formatAsPem(keydataB64)
        return keydataB64Pem
    }

    encodeBase64URL (arraybuffer) {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
            var bytes = new Uint8Array(arraybuffer)
            var len = bytes.length
            var base64 = ''
            for (var i = 0; i < len; i += 3) {
                base64 += chars[bytes[i] >> 2]
                base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)]
                base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)]
                base64 += chars[bytes[i + 2] & 63]
            }
            if ((len % 3) === 2) {
                base64 = base64.substring(0, base64.length - 1)
            } else if (len % 3 === 1) {
                base64 = base64.substring(0, base64.length - 2)
            }
            return base64
    }

    prepareData (header, payload) {
        let encH, encD
        encH = this.encodeBase64URL(new TextEncoder('utf-8').encode(header))
        encD = this.encodeBase64URL(new TextEncoder('utf-8').encode(payload))
        return encH + '.' + encD
    }

    bufferize (data) {
        return new TextEncoder('utf-8').encode(data)
    }

    getUserName () {
        return this.username
    }

    getHeader () {
        return '{"typ":"JWT","alg":"RS256"}'
    }
    base64StringToArrayBuffer (b64str) {
      var byteStr = atob(b64str)
      var bytes = new Uint8Array(byteStr.length)
      for (var i = 0; i < byteStr.length; i++) {
        bytes[i] = byteStr.charCodeAt(i)
      }
      return bytes.buffer
    }
    convertPemToBinary (pem) {
        var lines = pem.split('\n')
        var encoded = ''
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].trim().length > 0 &&
                lines[i].indexOf('-BEGIN RSA PRIVATE KEY-') < 0 &&
                lines[i].indexOf('-BEGIN RSA PUBLIC KEY-') < 0 &&
                lines[i].indexOf('-BEGIN PUBLIC KEY-') < 0 &&
                lines[i].indexOf('-END PUBLIC KEY-') < 0 &&
                lines[i].indexOf('-END RSA PRIVATE KEY-') < 0 &&
                lines[i].indexOf('-END RSA PUBLIC KEY-') < 0) {
                    encoded += lines[i].trim()
             }
        }
        return this.base64StringToArrayBuffer(encoded)
    }

    importPubKey (keyData) {
        /* format: jwk
            keyData: ArrayBuffer or a JSONWebKey
            algo:
            extractable: true
            usages: encrypt */
        // const algo = {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}
        const algo = {name: 'RSA-OAEP', hash: 'SHA-256'}
        this.log('calling import...')
        const key = window.crypto.subtle.importKey('jwk',
                                keyData,
                                algo,
                                true,
                                ['encrypt'])
        //                        ['verify'])
        /* const pem = this.spkiToPEM(key)
        this.log('key imported')
        this.log(pem) */
        return key
        /*
        log.log('return import..')
        log.log(key)
        return key */
    }
    hash (string) {
        const b = new TextEncoder('utf-8').encode(string)
        const h = window.crypto.subtle.digest(defaultHash, b)
        // this.log(h)
        return h
    }
    encryptAsym (key, buf) {
        // const bufData = this.bufferize(hexString)
        // this.log(hexString)
        const enc = window.crypto.subtle.encrypt('RSA-OAEP', key, buf)
        // this.log(enc)
        return enc
    }
    async encryptSym (data, key) {
    }
    async sign (data) {
        /* enrich with JWT header and sign */
        const privKeyRef = await this.getPrivKey(this.getUserName())
        const headBody = this.prepareData(this.getHeader(), data)
        let bufData = this.bufferize(headBody)
        const sig = await this.signData(bufData, privKeyRef)
        return headBody + '.' + sig
    }

    async signData (bufData, privKeyRef) {
        const sig = await window.crypto.subtle.sign('RSASSA-PKCS1-v1_5',
            privKeyRef, bufData)
        return this.encodeBase64URL(sig)
    }

    async getPrivKey (username) {
        /* let lastRow = await this.db.keystore.orderBy('id')
            .where('username').equals(username).last() */
        let lastRow = await this.db.keystore.orderBy('id').last()
        return lastRow.priv_key
    }

    async getPubKey (username) {
        let lastRow = await this.db.keystore.orderBy('id')
            .where('username').equals(username).last()
        window.crypto.subtle.exportKey('spki', lastRow.pub_key).then(function (keydata) {
            let pem = this.spkiToPEM(keydata)
            return pem
        })
    }

    createKeys (username) {
        this.generateRSAKeyPair(username)
        .then(async function (keypair) {
            this.storeKeys(username, keypair)
            const key = await window.crypto.subtle.exportKey('spki', keypair.publicKey)
            const pem = this.spkiToPEM(key)
            console.log(pem)
            return pem
        }.bind(this))
        .catch(function (err) {
            console.log(err)
            throw err
        })
    }

    storeKeys (username, keypair) {
        this.log(this.db.keystore)
        return this.db.keystore.put({username: username,
                  priv_key: keypair.privateKey,
                  pub_key: keypair.publicKey,
                  date: Date.now()})
    }

    generateRSAKeyPair (username) {
        return window.crypto.subtle.generateKey(
              {
                  name: defaultAlgo,
                  modulusLength: defaultModulusLength,
                  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                  hash: {name: defaultHash}
              },
              false,
              ['sign', 'verify']
        )
    }
}

export default new KeyStoreManager()
