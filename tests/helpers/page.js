const puppeteer = require('puppeteer')
const sessionFactory = require('../factories/sessionFactory')
const userFactory = require('../factories/userFactory')

module.exports = class Page {
    static async build(){
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox'] // Decrease amount of time, puppeteer needs to run tests
        })
        // pPage like 'puppeteer page'
        const pPage = await browser.newPage()
        const page = new Page(pPage)

        return new Proxy(page, {
            get(target, key){
                // Additional access to 'browser'. Access order is prioritized.
                return target[key] || browser[key] || pPage[key] 
            }
        })
    }

    constructor(page) {
        this.page = page
    }

    async login(){
        // Simulating loggin in, by existing user!
        // We are faking cookie session, using buffer nad keygrip
        const user = await userFactory()
        const { session, sig } = sessionFactory(user)

        await this.setCookie({ name: 'session', value: session })
        await this.setCookie({ name: 'session.sig', value: sig })
        // Show blogs
        await this.goto('http://localhost:3000/blogs')

        // li:nth-child(2) or li:last-child 
        // or a[href="/auth/logout"] <- appropriate quotes!
        const selector = 'a[href="/auth/logout"]'

        // It is possible that page has not been loaded yet!
        // Let's use waitFor
        await this.waitFor(selector)
    }

    async getContentsOf(selector) {
        return this.$eval(selector, el => el.innerHTML)
    }

    async get(path){ 

        // https://github.com/puppeteer/puppeteer/blob/v4.0.0/docs/api.md#pageevaluatepagefunction-args
        // Fetch function will be serialized as a string. We lose context, so 'page' variable will be not defined.
        // We need to use second argument of 'evaluate', to save 'path' variable
        // this.evaluate works, because we used Proxy to have methods on the same level
        // Super correct is 'this.page.evaluate', where 'this.page' is our puppeteer page passed in constructor

        return this.evaluate(
            (_path) => {

                 return fetch(_path, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                }).then(res => res.json())

            },
            path
        )
    }

    async post(path, data){
        return this.evaluate(
            (_path, _data) => {

                 return fetch(_path, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(_data)
                }).then(res => res.json())

            }, 
            path,
            data
        )
    }

    execRequests(actions){
        return Promise.all(
            actions.map(({method, path, data}) => {
                return this[method](path, data)
            })
        )
    }
}

//module.exports = Page