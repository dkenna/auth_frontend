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
  </div>
</template>

<script>
import axios from 'axios'
import jwt from 'jsonwebtoken'
import VueIdb from 'vue-idb'

const idb = new VueIdb({
  version: 1,
  database: 'test',
  schemas: [
    { tests: 'id, title, created_at, updated_at' },
    { posts: 'id, owner' },
    { friends: '++id, name, age' }
  ]
})

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
      idb: idb,
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
    selectAction: function (event, action) {
      if (action.id === 1) {
        this.getChallenge()
      } else if (action.id === 2) {
        this.signToken()
      }
    },
    signToken: function (event) {
      if (this.selectedProfile && this.serverToken) {
        var username = this.selectedProfile.user.username
        var payload = {signed_challenge: this.serverToken, username: username}
        console.log('selectedProfile: OK')
        this.signedToken = jwt.sign(payload, this.selectedProfile.private_key,
          {algorithm: 'RS256'})
      }
    },
    getChallenge: function (event) {
      axios.get(`http://dkenna.com:8000/get_auth_challenge`)
        .then(response => {
          this.serverToken = response.data['token']
        })
        .catch(e => {
          this.errors.push(e)
        })
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
</style>
