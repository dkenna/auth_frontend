import * as log from 'loglevel'
import axios from 'axios'

const blogU = 'http://dkenna.com:8001/art'

log.setLevel('debug')

class BlogClient {
    constructor () {
      this.user = null
      this.arts = []
      this._article = null
      this.token = null
    }
    setUser () {}
    setToken (token) {
        /* replace this by a dynamic token engine */
        this.token = token
    }
    articles () {
        return axios.get(blogU + 's', {withCredentials: true,
                headers: {'Authorization': `Bearer ${this.token}`}})
    }
    article (id) {
        this._article = axios.get(blogU + '/' + id,
            {headers: {'Authorization': `Bearer ${this.token}`}})
        return this._article
    }
    delArticle (id) {
        const resp = axios.delete(blogU + '/' + id,
            {headers: {'Authorization': `Bearer ${this.token}`}})
        return resp
    }
    saveArticle (id, data) {
        this._article = axios.put(blogU + '/' + id, data,
            {headers: {'Authorization': `Bearer ${this.token}`}})
        return this._article
    }
}

const blog = new BlogClient()
export default blog
