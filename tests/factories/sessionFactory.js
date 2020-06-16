const Buffer = require('safe-buffer').Buffer
const Keygrip = require('keygrip')
const keys = require('../../config/keys')

const keygrip = new Keygrip([keys.cookieKey])


module.exports = user => {

    const sessionObject = {
        passport: {
            user: user._id.toString()
        }
    }

    const session = Buffer
        .from(JSON.stringify(sessionObject))
        .toString('base64')

    //library chooses to add 'session='
    const sig = keygrip.sign('session=' + session)
    return { session, sig }
}



// ES6
// import { Buffer } from 'safe-buffer'
// import Keygrip from 'keygrip'
// import keys from '../../config/keys'

// const keygrip = new Keygrip([keys.cookieKey])


// export default (user) => {
//     const Buffer = require('safe-buffer').Buffer

//     const sessionObject = {
//         passport: {
//             user: user._id.toString()
//         }
//     }

//     const session = Buffer
//         .from(JSON.stringify(sessionObject))
//         .toString('base64')

//     //library chooses to add 'session='
//     const sig = keygrip.sign('session=' + session)
//     return { session, sig }
// }