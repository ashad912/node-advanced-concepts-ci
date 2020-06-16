const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')
const keys = require('../config/keys')

//const redisUrl = 'redis://127.0.0.1:6379'
const client = redis.createClient(keys.redisUrl)
//client.get = util.promisify(client.get)
client.hget = util.promisify(client.hget)
const exec = mongoose.Query.prototype.exec //ref to original exec function


//monkey patching
// Monkey patching is a technique to add, modify, or suppress the default behavior
// of a piece of code at runtime without changing its original source code.

// arguments
// https://nodejs.org/en/knowledge/javascript-conventions/what-is-the-arguments-object/
/*
    const myfunc = function(one) {
        arguments[0] === one;
        arguments[1] === 2;
        arguments.length === 3;
    }

    myfunc(1, 2, 3);

*/

// console.log(this.getQuery())
// console.log(this.mongooseCollection.name)

// //to copy getQuery result, and collection.name

// const key = JSON.stringify(Object.assign({}, this.getQuery(), {
//     collection: this.mongooseCollection.name
// }))

//Error: Failed to deserialize user out of session!


//result.validate -> return a function, this is a MongoDocObject

//storing data in redis, is not cheap at all
//we want redis to not store data from all queries


mongoose.Query.prototype.cache = function(options = {}) {
    // 'this' is query instance. Set useCache value only for this instance
    this.useCache = true
    this.hashKey = JSON.stringify(options.key || '')
    return this // For chainable
}

mongoose.Query.prototype.exec = async function () {

    // By useCache, it is possible to check if query has to be cached
    if(!this.useCache){
        return exec.apply(this, arguments)
    }

    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }))

    // See if we have a value for 'key' in redis
    const cacheValue = await client.hget(this.hashKey, key)

    //If we do, return that
    if(cacheValue){
        // Data should be returned in Mongoose Model format
        // Data can be object or array, we need to handle it
        const data = JSON.parse(cacheValue)

        return Array.isArray(data) 
            ? data.map(doc => new this.model(doc))
            : new this.model(data)
    }

    //Otherwise, issue the query and store the result in redis
    const result = await exec.apply(this, arguments)

    client.hset(this.hashKey, key, JSON.stringify(result))

    return result
}

module.exports = {
    clearHash(hashKey){
        // Hash key can have different types. For safety we use JSON.stringify
        client.del(JSON.stringify(hashKey)) 
    }
}

// backup
// mongoose.Query.prototype.exec = async function () {

//     // By useCache, it is possible to check if query has to be cached
//     if(!this.useCache){
//         return exec.apply(this, arguments)
//     }

//     const key = JSON.stringify(Object.assign({}, this.getQuery(), {
//         collection: this.mongooseCollection.name
//     }))

//     // See if we have a value for 'key' in redis
//     const cacheValue = await client.get(key)

//     //If we do, return that
//     if(cacheValue){
//         // Data should be returned in Mongoose Model format
//         // Data can be object or array, we need to handle it
//         const data = JSON.parse(cacheValue)

//         return Array.isArray(data) 
//             ? data.map(doc => new this.model(doc))
//             : new this.model(data)
//     }

//     //Otherwise, issue the query and store the result in redis
//     const result = await exec.apply(this, arguments)

//     client.set(key, JSON.stringify(result))

//     return result
// }