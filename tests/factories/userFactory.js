const mongoose = require('mongoose')
const User = mongoose.model('User')

// Need to start up Mongo

module.exports = () => {
    // Perfect location to inject props
    return new User({  }).save()
}