
const Page = require('./helpers/page')

let page;

beforeEach(async () => {
    page = await Page.build()
    await page.goto('http://localhost:3000')
})


afterEach(async () => {
    // Puppeteer Page and Browser classes both have close() method. We need to prioritize these methods.
    await page.close()
})


test('the header has the correct text', async () => {


    //why so complicated?
    //el => el.innerHTML is converted to string, sent, converted to function,
    //and in the end Chromium execute it
    //dollar sign is normal sign, nothing special
    //const text = await page.$eval('a.brand-logo', el => el.innerHTML)
    const text = await page.getContentsOf('a.brand-logo')
    expect(text).toEqual('Blogster')
})


test('clicking login starts oauth flow', async () => {
    await page.click('.right a')

    const url = await page.url()

    expect(url).toMatch(/accounts\.google\.com/)
})

//test.only!!!! run only this test

test('When signed in, shows logout button', async () => {

    await page.login()

    //const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML)

    const text = await page.getContentsOf('a[href="/auth/logout"]')
    expect(text).toEqual('Logout')

})