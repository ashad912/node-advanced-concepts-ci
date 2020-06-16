//Alternatively can modify script launch in package.json file -> "test": "jest --testTimeout=10000"
jest.setTimeout(10000) // In msc, for every single test

require('../models/User')

const mongoose = require('mongoose')
const keys = require('../config/keys')

mongoose.Promise = global.Promise

beforeAll(async () => {
    await mongoose.connect(keys.mongoURI, { useMongoClient: true })
})


afterAll(async () => { 
    await mongoose.disconnect()
});