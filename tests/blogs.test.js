const Page = require('./helpers/page')

let page;

beforeEach(async () => {
    page = await Page.build()
    await page.goto('http://localhost:3000')
})

afterEach(async () => {
    await page.close()
})


describe('When logged in', () => {
    beforeEach(async () => {
        await page.login()
        await page.click('a.btn-floating')
    })

    test('can see blog create form', async () => {    
        const label = await page.getContentsOf('form label')
    
        expect(label).toEqual('Blog Title')
    
    })

    describe('and using valid inputs', () => {
        beforeEach(async () => {
            await page.type('.title input', 'My Title')
            await page.type('.content input', 'My Content')
            await page.click('form button')
        })

        test('submitting takes user to review screen', async () => {
            const text = await page.getContentsOf('form h5')
            expect(text).toEqual('Please confirm your entries')
        })

        test('submitting then saving adds blog to index page', async () => {
            await page.click('button.green')
            // It can be neccessary to wait for redirection
            await page.waitFor('.card')
            const title = await page.getContentsOf('.card-title')
            const content = await page.getContentsOf('p')

            expect(title).toEqual('My Title')
            expect(content).toEqual('My Content')

            
        })
    })

    describe('and using invalid inputs', () => {
        beforeEach(async () => {
            await page.click('form button')
        })

        test('the form shows an error message', async () => {
            const titleError = await page.getContentsOf('.title .red-text')
            const contentError = await page.getContentsOf('.content .red-text')
            
            expect(titleError).toEqual('You must provide a value')
            expect(contentError).toEqual('You must provide a value')
            
        })
    })
})

describe('User is not logged in,', () => {

    const actions = [
        {
            method: 'get',
            path: '/api/blogs'
        },
        {
            method: 'post',
            path: '/api/blogs',
            data: {
                title: 'My Title',
                content: 'My Content'
            }
        }
    ]

    test('blog related actions are prohibited', async () => {
        // Promise.all in execRequests() product single promise which is return here
        // Actions are executed in parallel, which means faster tests
        const results = await page.execRequests(actions)

        for (let result of results) {
            expect(result).toEqual({error: 'You must log in!'})
        }
    })
})