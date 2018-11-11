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
      <div><b-button>Sign and Send Token</b-button></div>
      <div v-if="selectedProfile">User: {{selectedProfile.user.username}}</div>
      <pre v-if="selectedProfile">{{selectedProfile.private_key}}</pre>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Signer',
  data () {
    return {
      profiles: [],
      selectedProfile: null,
      errors: [],
      msg: 'TokenSigner'
    }
  },
  created () {
    axios.get(`http://localhost:8000/profiles/?format=json`)
      .then(response => {
        // JSON responses are automatically parsed.
        this.profiles = response.data
      })
      .catch(e => {
        this.errors.push(e)
      })
  }
}
</script>
