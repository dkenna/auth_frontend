<template>
  <div class="Login">
    <h1>{{ title }}</h1>
      <!--<div class="passphrase_box" v-if="passphrasePrompt">-->
      <div id="loginbox">
            <div v-if="!username" id="nonauthenticated">
                <div style="float: left">
                  <b-form-textarea class="small" placeholder="Passphrase" v-model="passphrase">
                  </b-form-textarea>
                </div>
                <div style="float: left">
                  <b-button @click="login" variant="primary">
                     Login
                  </b-button>
                </div>
            </div>
            <div v-if="username" id="authenticated">
                <div><a href="#" @click="forget">User: {{username}}</a></div>
            </div>
      </div>
      <div id="logbox">
        <b-form-textarea v-if="logText"
            v-model="logText" readonly plaintext :rows="6"
            :max-rows="6"></b-form-textarea>
      </div>
  </div>
</template>

<script>
import AuthClient from '../authclient.js'
import Listener from '../listener.js'
import * as log from 'loglevel'

const authClient = new AuthClient()

// axios.defaults.withCredentials = true
export default {
  name: 'Login',
  data () {
    return {
      passphrase: null,
      authClient: null,
      passphrasePrompt: false,
      logText: '',
      tokenLog: '',
      username: null,
      errors: [],
      actions: [
                {id: 1, name: 'Login'}
               ],
      title: 'Login'
    }
  },
  created () {
    authClient.setListener(new Listener(this.logAction))
    this.username = authClient.username
  },
  methods: {
    logAction: function (msg) {
      this.logText = msg + '\n' + this.logText
    },
    login: async function (event) {
      log.log('authenticating...')
      await authClient.pauthenticate(this.passphrase)
      this.username = authClient.username
      this.passphrase = null
      log.log('user: ' + this.username + ' logged in.')
    },
    forget: function () {
        this.username = null
        authClient.forget()
    },
    authenticate: function (event, action) {
    },
    sign: async function () {
      this.logAction('retrieving last priv key for signing...')
      try {
        let data = '{"a":"b"}'
        let sig = authClient.sign(data)
        console.log(sig)
      } catch (error) {
        this.logAction(error)
        console.error(error)
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
#authenticated {
  font-size: 0.8em;
}
.passphrase_box {
  width: 60%;
  -webkit-align-content: center;
  align-content: center;
  /* margin-top: 25px border; */
  /*border: 1px solid gray;*/
  font-size: 0.8em;
  margin:0 auto;
  padding: 5px;
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
#loginbox {
  /*width: 30%;*/
  float: right;
  position: absolute;
  top: 0;
  right: 10px;
  text-align: right;
  font-size: 0.9em;
}
</style>
