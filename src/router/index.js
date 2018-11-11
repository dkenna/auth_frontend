import Vue from 'vue'
import Router from 'vue-router'
import Signer from '@/components/Signer'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Signer',
      component: Signer
    }
  ]
})
