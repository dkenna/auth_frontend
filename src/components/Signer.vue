<template>
  <div class="TokenSigner">
    <h1>{{ msg }}</h1>
      <b-dropdown  v-if="profiles && profiles.length"
                     id="ddown1" text="Select User" class="m-md-2"
                     v-model="selectedProfile">
        <b-dropdown-item  v-for="profile of profiles"
                            :key="profile.user.id"
                            :value="profile.user.username"
                            @click="selectedProfile = profile">
         {{profile.user.username}}
        </b-dropdown-item>
      </b-dropdown>
      <b-dropdown  v-if="actions && actions.length"
                     id="ddown1" text="Select Action" class="m-md-2"
                     v-model="selectedAction">
        <b-dropdown-item  v-for="action of actions"
                            :key="action.id"
                            :value="action.name"
                            @click="selectAction($event,action)">
         {{action.name}}
        </b-dropdown-item>
      </b-dropdown>
      <div class="small"><b-form-textarea class="small" v-if="tokenLog"
                                v-model="tokenLog" readonly plaintext :rows="10"
                                :max-rows="10"></b-form-textarea></div>
      <div v-if="selectedProfile">User: {{selectedProfile.user.username}}</div>
      <pre v-if="selectedProfile">{{selectedProfile.private_key}}</pre>
      <pre v-if="selectedProfile">{{selectedProfile.public_key}}</pre>
      <div id="logbox">
        <b-form-textarea v-if="logText"
            v-model="logText" readonly plaintext :rows="6"
            :max-rows="6"></b-form-textarea>
      </div>
  </div>
</template>

<script>
import { spkiToPEM, db } from '../keydatabase.js'
import axios from 'axios'
import jwt from 'jsonwebtoken'

// axios.defaults.withCredentials = true
export default {
  name: 'Signer',
  data () {
    return {
      profiles: [],
      selectedProfile: null,
      selectedAction: null,
      authChallenge: null,
      updatePubKeyChallenge: null,
      signedAuthChallenge: null,
      signedUpdateChallenge: null,
      dbPromise: null,
      logText: '',
      tokenLog: '',
      errors: [],
      actions: [
                {id: 1, name: 'Get Auth Challenge'},
                {id: 2, name: 'Sign Challenge'},
                {id: 3, name: 'Authenticate'},
                {id: 4, name: 'Get Pub Key Challenge'},
                {id: 5, name: 'Sign Pub Key Challenge'},
                {id: 6, name: 'Get Update Token'},
                {id: 7, name: 'Generate Keypair'},
                {id: 8, name: 'Upload Public Key'},
                {id: 9, name: 'Sign with new Priv Key'}
               ],
      msg: 'TokenSigner'
    }
  },
  created () {
    axios.get(`http://dkenna.com:8000/profiles/?format=json`)
      .then(response => {
        // JSON responses are automatically parsed.
        this.profiles = response.data
      })
      .catch(e => {
        this.errors.push(e)
      })
  },
  methods: {
    logAction: function (msg) {
      this.logText = msg + '\n' + this.logText
    },
    logToken: function (msg, tokenName) {
      this.tokenLog = msg + '\n' + this.tokenLog
      this.tokenLog = tokenName + ' :' + '\n' + this.tokenLog
    },
    selectAction: function (event, action) {
      if (action.id === 1) {
        this.getChallenge()
      } else if (action.id === 2) {
        this.signedAuthChallenge = this.signToken(event, this.authChallenge)
      } else if (action.id === 3) {
        this.authenticate()
      } else if (action.id === 4) {
        this.getPubKeyChallenge()
      } else if (action.id === 5) {
        this.signedUpdateChallenge = this.signToken(event, this.updatePubKeyChallenge)
      } else if (action.id === 6) {
        this.getUpdateToken()
      } else if (action.id === 7) {
        this.generateKeyPair()
      } else if (action.id === 8) {
        this.uploadPublicKey()
      } else if (action.id === 9) {
        this.signData()
      }
    },
    signToken: function (event, challenge) {
      if (!this.selectedProfile) this.logAction('select a user first...')
      if (!challenge) this.logAction('get a challenge first...')
      if (this.selectedProfile && challenge) {
        let username = this.selectedProfile.user.username
        let payload = {challenge: challenge, username: username}
        let signedToken = jwt.sign(payload, this.selectedProfile.private_key,
          {algorithm: 'RS256'})
        this.logAction('signing challenge with priv key...')
        this.logToken(signedToken, 'signed challenge')
        return signedToken
      }
      return null
    },
    getChallenge: function (event) {
      axios.get(`http://dkenna.com:8000/get_auth_challenge`)
        .then(response => {
          this.authChallenge = response.data['token']
          this.logAction('getting login challenge from server...')
          this.logToken(this.authChallenge, 'auth challenge')
        })
        .catch(e => {
          this.errors.push(e)
        })
    },
    authenticate: function (event, action) {
      if (!this.signedAuthChallenge) {
        this.logAction('you first have to generate a signed token...')
      } else {
        this.logAction('authenticating...')
        axios({method: 'post',
               url: 'http://dkenna.com:8000/token_login',
               data: {username: this.selectedProfile.user.username,
                        signed_challenge: this.signedAuthChallenge},
               withCredentials: true})
          .then(function (response) {
              this.logAction('authenticated!')
              this.logToken(response.data['id_token'], 'id_token')
          }.bind(this)).catch(function (error) {
              this.logAction('authorization failed...')
              this.logAction(error)
          }.bind(this))
      }
    },
    getPubKeyChallenge: function (event) {
      axios.get(`http://dkenna.com:8000/get_update_challenge`)
        .then(response => {
          this.updatePubKeyChallenge = response.data['token']
          this.logAction('getting pubkey challenge from server...')
          this.logToken(this.updatePubKeyChallenge, 'update challenge')
        })
        .catch(e => {
          this.errors.push(e)
        })
    },
    getUpdateToken: function (event, action) {
      if (!this.signedUpdateChallenge) {
        this.logAction('you first have to generate a signed challenge...')
      } else {
        this.logAction('getting an update token...')
        axios.post('http://dkenna.com:8000/get_update_token',
                        { username: this.selectedProfile.user.username,
                        signed_challenge: this.signedUpdateChallenge})
          .then(function (response) {
              this.logToken(response.data['update_token'], 'update token')
          }.bind(this)).catch(function (error) {
              this.logAction('couldn\'t get update token...')
              this.logAction(error)
          }.bind(this))
      }
    },
    generateKeyPair: function () {
      if (!this.selectedProfile) {
        this.logAction('you must first select a profile')
        return
      }
      window.crypto.subtle.generateKey(
          {
              name: 'RSASSA-PKCS1-v1_5',
              modulusLength: 4096, // can be 1024, 2048, or 4096
              publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
              hash: {name: 'SHA-256'} // can be 'SHA-1', 'SHA-256', 'SHA-384', or 'SHA-512'
          },
          false, // whether the key is extractable (i.e. can be used in exportKey)
          ['sign', 'verify'] // can be any combination of 'sign' and 'verify'
      )
      .then(function (key) {
          // returns a keypair object
          this.logAction('generating keypair and storing it in indexeddb...')
          db.keystore.add({username: this.selectedProfile.user.username,
                  priv_key: key.privateKey,
                  pub_key: key.publicKey,
                  date: Date.now()})
      }.bind(this))
      .catch(function (err) {
          console.error(err)
      })
    },
    uploadPublicKey: async function () {
      this.logAction('retrieving last generated public key from indexeddb...')
      let lastRow = await db.keystore.orderBy('id').last()
      if (lastRow) {
        window.crypto.subtle.exportKey('spki', lastRow.pub_key).then(function (keydata) {
            console.log(lastRow.pub_key)
            let pem = spkiToPEM(keydata)
            this.logToken(pem, 'public key to upload')
        }.bind(this))
      } else {
        this.logAction('you must first generate a key...')
      }
    },
    buf2hex: function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf),
        x => (('00' + x.toString(16)).slice(-2))).join('')
    },
    encodeBase64URL: function (arraybuffer) {
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
    },
    signData: async function () {
      let buf = new TextEncoder('utf-8')
            .encode('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhIjoiYiJ9')
      this.logAction('retrieving last priv key for signing...')
      let lastRow = await db.keystore.orderBy('id').last()
      if (lastRow) {
        window.crypto.subtle.exportKey('spki', lastRow.pub_key).then(function (keydata) {
          console.log(lastRow.pub_key)
          let pem = spkiToPEM(keydata)
          this.logToken(pem, 'public key')
        }.bind(this))
        window.crypto.subtle.sign('RSASSA-PKCS1-v1_5', lastRow.priv_key, buf)
        .then(function (sig) {
          this.logToken(this.encodeBase64URL(sig), 'signature')
          // console.log(sig)
        }.bind(this))
        window.crypto.subtle.exportKey('spki', lastRow.priv_key).then(function (keydata) {
            // console.log(lastRow.priv_key)
            // let pem = spkiToPEM(keydata)
            // this.logToken(pem, 'priv key to upload')
        }).catch(function (error) {
              this.logAction('couldn\'t export private key...')
              this.logAction(error)
          }.bind(this))
      } else {
        this.logAction('you must first generate a key before signing...')
      }
    }
  }
}
</script>
<style>
.small {
  width: 60%;
  font-size: 0.8em;
  margin:0 auto;
}
#logbox {
  width: 30%;
  float: left;
  position: absolute;
  top: 0;
  left: 10px;
  text-align: left;
  font-size: 0.7em;
}
</style>
