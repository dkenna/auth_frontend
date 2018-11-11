<template>
  <div class="Signer">
    <h1>{{ msg }}</h1>
      <b-dropdown  v-if="users && users.length" id="ddown1" text="Dropdown Button" class="m-md-2">
        <b-dropdown-item  v-for="user of users"
                            :key="user.id"
                            :value="user.username">
         {{user.username}}
        </b-dropdown-item>
      </b-dropdown>
      <!--<ul v-if="users && users.length">
        <li v-for="user of users">
          <p><strong>{{users.title}}</strong></p>
          <p>{{user.username}}</p>
        </li>
      </ul>

      <ul v-if="errors && errors.length">
        <li v-for="error of errors">
          {{error.message}}
        </li>
      </ul>-->
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Signer',
  data () {
    return {
      users: [],
      errors: [],
      msg: 'Signer'
    }
  },
  created () {
    axios.get(`http://localhost:8000/users/?format=json`)
      .then(response => {
        // JSON responses are automatically parsed.
        this.users = response.data
      })
      .catch(e => {
        this.errors.push(e)
      })
  }
}
</script>
