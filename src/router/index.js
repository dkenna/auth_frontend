import Vue from 'vue'
import Router from 'vue-router'
import Signer from '@/components/Signer'
import AuthClient from '@/components/AuthClient'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Signer',
      component: Signer
    },
    {
      path: '/authcli',
      name: 'AuthCli',
      component: AuthClient
    }
  ]
})
