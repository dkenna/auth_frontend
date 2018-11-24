<template>
  <div class="Authorization client">
    <h1>{{ msg }}</h1>
    <div class="small">
        <div  class="col-xs-3">
            <b-form-input v-model="username"
                  type="name"
                  placeholder="Name"></b-form-input>
        </div>
        <!--<p>Value: {{ username }}</p>-->
        <div class="padded">
            <b-button size="sm" variant="secondary">generate keypair</b-button>
        </div>
        <div class="padded">
            <b-form-textarea class="small"
            v-model="log_area" readonly plaintext :rows="6" placeholder="log area"
            :max-rows="6"></b-form-textarea>
        </div>
    </div>
  </div>
</template>

<script>
// import axios from 'axios'
import db from '../keydatabase.js'

export default {
  name: 'AuthCli',
  data () {
    return {
      errors: [],
      actions: [],
      username: '',
      log_area: '',
      msg: 'AUTH CLIENT'
    }
  },
  created () {
    console.log(db.keystore)
    db.keystore.put({username: 'bob', priv_key: 'xx', pub_key: 'yy', date: Date.now()})
    db.keystore.add({username: 'alice', priv_key: 'xx', pub_key: 'yy', date: Date.now()})
    console.log(db.keystore)
  },
  methods: {
  }
}
</script>
<style>
.small {
  width: 60%;
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
