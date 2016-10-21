'use strict';

const authentication = require('feathers-authentication');

var _bcryptjs = require('bcryptjs');
var _bcryptjs2 = _interopRequireDefault(_bcryptjs);
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
}

module.exports = function () {
    const app = this;

    let config = app.get('auth');

    app.use('/auth/account', {
        create({email, password}, params) {
            return new Promise((resolve, reject) => {

                const accountService = app.service('/accounts');
                const userService = app.service('/users');
                const jwtService = app.service('/auth/token');

                accountService.find({'email': email}).then((accounts) => {
                    // 1. Find a fitting account
                    var account = accounts[0] || accounts.data && accounts.data[0];

                    if (!account) {
                        return reject(null, false);
                    }

                    return account;
                }).then((account) => {
                    // 2. Check if credentials of account are correct
                    var crypto = _bcryptjs2.default;
                    var hash = account['password'];

                    if (!hash) {
                        return reject(new Error('Acccount record in the database is missing a password'));
                    }

                    return new Promise((done) => {
                        crypto.compare(password, hash, (error, result) => {
                            // Handle 500 server error.
                            if (error) {
                                return reject(error);
                            }

                            if (!result) {
                                return reject(new Error('Passwords not matching'));
                            }

                            return done(account.userId);
                        });
                    });
                }).then((userId) => {
                    // 3. account credentials are correct - get user
                    return userService.get(userId);
                }).then((user) => {
                    // 4. if user found: generate jwt
                    return jwtService.create(user);
                }).then((jwt) => {
                    // 5. return generated JWT
                    resolve(jwt);
                }).catch((error) => {
                    reject(error);
                });
            });
        }
    });

    app.configure(authentication(config));
};
