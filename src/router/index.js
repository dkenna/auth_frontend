import Vue from 'vue'
import Router from 'vue-router'
// import Signer from '@/components/Signer'
// import AuthClient from '@/components/AuthClient'
import Login from '@/components/Login'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Login',
      component: Login
    }
/* ,
    {
      path: '/signer',
      name: 'Signer',
      component: Signer
    }
* /
    /* ,
    {
      path: '/authcli',
      name: 'AuthCli',
      component: AuthClient
    }, */
  ]
})
