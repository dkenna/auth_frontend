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

      <!--<div><b-button>Sign and Send Token</b-button></div>-->
      <div class="small"><b-form-textarea class="small" v-if="serverToken"
                                v-model="serverToken" readonly plaintext :rows="6"
                                :max-rows="6">{{serverToken}}</b-form-textarea></div>
      <div class="small"><b-form-textarea class="small" v-if="signedToken"
                                v-model="signedToken" readonly plaintext :rows="6"
                                :max-rows="6">{{signedToken}}</b-form-textarea></div>
      <div v-if="selectedProfile">User: {{selectedProfile.user.username}}</div>
      <pre v-if="selectedProfile">{{selectedProfile.private_key}}</pre>
      <pre v-if="selectedProfile">{{selectedProfile.public_key}}</pre>
      <div id="logbox">
        <b-form-textarea v-if="logText"
            v-model="logText" readonly plaintext :rows="6"
            :max-rows="6">{{logText}}</b-form-textarea>
      </div>
  </div>
</template>

<script>
import axios from 'axios'
import jwt from 'jsonwebtoken'

export default {
  name: 'Signer',
  data () {
    return {
      profiles: [],
      selectedProfile: null,
      selectedAction: null,
      serverToken: null,
      signedToken: null,
      dbPromise: null,
      logText: '',
      errors: [],
      actions: [{id: 1, name: 'Get a Challenge'}, {id: 2, name: 'Sign Challenge'},
        {id: 3, name: 'Authenticate'}],
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
    selectAction: function (event, action) {
      if (action.id === 1) {
        this.getChallenge()
      } else if (action.id === 2) {
        this.signToken()
      } else if (action.id === 3) {
        this.authenticate()
      }
    },
    signToken: function (event) {
      if (!this.selectedProfile) this.logAction('select a user first...')
      if (!this.serverToken) this.logAction('get a login challenge first...')
      if (this.selectedProfile && this.serverToken) {
        var username = this.selectedProfile.user.username
        var payload = {signed_challenge: this.serverToken, username: username}
        console.log('selectedProfile: OK')
        this.signedToken = jwt.sign(payload, this.selectedProfile.private_key,
          {algorithm: 'RS256'})
          this.logAction('signing challenge with priv key...')
      }
    },
    getChallenge: function (event) {
      axios.get(`http://dkenna.com:8000/get_auth_challenge`)
        .then(response => {
          this.serverToken = response.data['token']
          this.logAction('getting login challenge from server...')
        })
        .catch(e => {
          this.errors.push(e)
        })
    },
    authenticate: function (event, action) {
      if (!this.signedToken) {
        this.logAction('you first have to generate a signed token...')
      } else {
        this.logAction('authenticating...')
        axios.post('http://dkenna.com:8000/token_login', { username: this.selectedProfile.user.username,
                          signed_challenge: this.signedToken})
          .then(function (response) {
              this.logAction(response.data['id_token'])
          }.bind(this)).catch(function (error) {
              this.logAction('authorization failed...')
              this.logAction(error)
          }.bind(this))
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
