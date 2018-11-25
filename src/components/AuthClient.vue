<template>
  <div class="Authentication Client">
      <div  class="form-group">
        <h1>{{ msg }}</h1>
        <div>
            <div style="margin: 0 auto; margin-bottom: 2px;" class="col-5">
              <b-dropdown  v-if="profiles && profiles.length"
                             id="ddown1" text="Select User" class="m-md-2"
                             v-model="selectedProfile">
                <b-dropdown-item  v-for="profile of profiles"
                                    :key="profile.user.id"
                                    :value="profile.user.username"
                                    @click="selectedProfile = profile">
                 {{profile.user.first_name}} {{profile.user.last_name}}
                </b-dropdown-item>
              </b-dropdown>
            </div>
            <div v-if="selectedProfile">User: {{selectedProfile.user.username}}</div>
            <div v-if="selectedProfile" class="small">
                <b-form-textarea id="passphrase" :max-rows="3"
                      :value="selectedProfile.passphrase" plaintext :rows="3"></b-form-textarea>
            </div>
            <div>
              <b-dropdown  v-if="actions && actions.length"
                     id="ddown1" text="Select Action" class="m-md-2"
                     v-model="selectedAction">
                <b-dropdown-item  v-for="action of actions"
                            :key="action.id"
                            :value="action.name"
                            @click="selectAction($event,action)">
                {{action.name}}</b-dropdown-item>
              </b-dropdown>
            </div>
            <div class="small">
                <b-form-textarea id="log_area"
                v-model="log_area" readonly plaintext :rows="10" placeholder="<log area>"
                :max-rows="10"></b-form-textarea>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
// import axios from 'axios'
import { spkiToPEM, db } from '../keydatabase.js'
import JQuery from 'jquery'
import axios from 'axios'
let $ = JQuery

export default {
  name: 'AuthCli',
  data () {
    return {
      errors: [],
      profiles: [],
      selectedAction: '',
      selectedProfile: '',
      actions: [{id: 1, name: 'Gen keypair'}, {id: 2, name: 'Login'},
                {id: 3, name: 'Get token'}, {id: 4, name: 'Export pubkey'}],
      username: '',
      passphrase: '',
      log_area: '',
      msg: 'AUTH CLIENT'
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
    window.crypto.subtle.generateKey(
        {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 2048, // can be 1024, 2048, or 4096
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: {name: 'SHA-256'} // can be 'SHA-1', 'SHA-256', 'SHA-384', or 'SHA-512'
        },
        false, // whether the key is extractable (i.e. can be used in exportKey)
        ['sign', 'verify'] // can be any combination of 'sign' and 'verify'
    )
    .then(function (key) {
        // returns a keypair object
        console.log(key)
        console.log(key.publicKey)
        console.log(key.privateKey)
        db.keystore.add({username: 'alice',
                priv_key: key.privateKey,
                pub_key: key.publicKey,
                date: Date.now()})
    })
    .catch(function (err) {
        console.error(err)
    })
  },
  updated () {
    let height = $('#log_area').prop('scrollHeight')
    $('#log_area').scrollTop(height)
    console.log($('#log_area').scrollTop())
  },
  methods: {
    selectAction: function (event, action) {
      if (action.id === 1) {
        // this.getChallenge()
      } else if (action.id === 2) {
        // this.signToken()
      } else if (action.id === 3) {
        // this.signToken()
      } else if (action.id === 4) {
        this.exportPubKey(event)
      }
    },
    exportPubKey: async function (event) {
      let lastRow = await db.keystore.orderBy('id').last()
      window.crypto.subtle.exportKey('spki', lastRow.pub_key).then(function (keydata) {
          console.log(lastRow.pub_key)
          let pem = spkiToPEM(keydata)
          this.log_area += pem + '\n'
      }.bind(this))
    }
  }
}
</script>
<style>
.small {
  width: 60%;
  -webkit-align-content: center;
  align-content: center;
  margin-top: 25px border;
  /*border: 1px solid gray;*/
  font-size: 0.8em;
  margin:0 auto;
  padding: 5px;
}
.padded {
  margin-bottom: 10px;
}
</style>
