<template>
  <div class="Login">
    <h1 ref="title" id="title" contenteditable="true"><slot>{{ title }}</slot></h1>
      <!--<div class="passphrase_box" v-if="passphrasePrompt">-->
      <div id="loginbox">
            <div v-if="!username" id="nonauthenticated" class="input-group">
                <b-form-textarea style="display: inline" class="small" placeholder="Passphrase" v-model="passphrase">
                </b-form-textarea>
                <b-button @click="login" variant="primary" size="sm">
                   Login
                </b-button>
            </div>
            <div v-if="username" id="authenticated">
                <div><a href="#" @click="forget">User: {{username}}</a></div>
            </div>
            <div id="articlesbox" v-if="articles">
                <b-list-group>
                  <b-list-group-item href="#" v-for="art in articles" v-bind:key="art.id" @click="loadArticle(art)">
                        {{art.title}}
                  </b-list-group-item>
                </b-list-group>
            </div>
      </div>
      <div id="contentbox">
        <div ref="text" id="text" contenteditable="true">
            <slot>{{text}}</slot>
        </div>
        <div id="artcontrols" >
          <b-button @click="deleteArticle" variant="danger" size="sm">
              Delete
          </b-button>
          <b-dropdown id="ddown1" text="Save" size="sm" variant="primary" class="m-sm-2">
            <b-dropdown-item @click="saveArticle">Save</b-dropdown-item>
            <b-dropdown-item @click="saveArticle(true)">As new</b-dropdown-item>
          </b-dropdown>
          <!--<b-button @click="saveArticle" variant="primary" size="sm">
              Save
          </b-button>-->
        </div>
      </div>
      <div id="logbox">
        <b-form-textarea v-if="logText"
            v-model="logText" readonly plaintext :rows="6"
            :max-rows="6">
        </b-form-textarea>
      </div>
  </div>
</template>

<script>
import AuthClient from '../authclient.js'
import Listener from '../listener.js'
import * as log from 'loglevel'
import blog from '../blog.js'

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
      articleId: null,
      articles: [],
      errors: [],
      actions: [
                {id: 1, name: 'Login'}
               ],
      title: 'lore ip...',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
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
    saveArticle: async function (isNew = false) {
      if (!this.articleId || isNew === true) {
        // upsert, id === 0
       const newArt = await blog.saveArticle(0, {title: this.title, text: this.text})
       this.articles.unshift(newArt.data)
       this.articleId = newArt.data.id
      } else {
        this.title = this.$refs.title.innerHTML
        this.text = this.$refs.text.innerHTML
        const listItem = this.articles.find(obj => { return obj.id === this.articleId })
        listItem.title = this.title
        listItem.text = this.text
        blog.saveArticle(this.articleId, {id: this.articleId, title: this.title, text: this.text})
        log.log('article saved')
      }
    },
    deleteArticle: async function () {
        if (this.articleId) {
          blog.delArticle(this.articleId)
          this.articles = this.articles.filter(obj => obj.id !== this.articleId)
          log.log('article deleted')
        }
    },
    loadArticle: async function (art) {
      const article = await blog.article(art.id)
      log.log('loading article')
      this.title = article.data.title
      this.$refs.title.innerHTML = article.data.title
      this.text = article.data.text
      this.$refs.text.innerHTML = article.data.text
      this.articleId = article.data.id
    },
    login: async function (event) {
      log.log('authenticating...')
      await authClient.pauthenticate(this.passphrase)
      this.username = authClient.username
      this.passphrase = null
      blog.setToken(authClient.id_token)
      log.log('user: ' + this.username + ' logged in.')
      this.articles = await blog.articles()
      this.articles = this.articles.data
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
  font-size: 0.9em;
  /* float: left; */
}
#nonauthenticated {
  font-size: 0.9em;
/*  float: left;*/
}
.passphrase_box {
  /* -webkit-align-content: center;
  align-content: center;*/
  /* margin-top: 25px border; */
  /*border: 1px solid gray;*/
  font-size: 0.8em;
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
  width: 15%;
  float: right;
  position: absolute;
  top: 0;
  right: 10px;
  text-align: right;
  font-size: 0.9em;
}
#artcontrols {
  text-align: right;
  padding-top: 20px;
  width: 80%;
}
#contentbox {
  width: 70%;
  margin:0 auto;
  padding: 15px;
}
#content {
  width: 70%;
  text-align: left;
  margin:0 auto;
  padding: 15px;
  outline:0px !important;
  -webkit-appearance:none;
}
#text {
  text-align: left;
}
h1 {
  font-size: 22px;
}
#articlesbox {
  /* float: right; */
  /* width: 40%; */
  margin-top: 30px;
}
#articles {
}
</style>
