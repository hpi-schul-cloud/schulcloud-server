'use strict';

const authentication = require('feathers-authentication');



module.exports = function() {
    const app = this;
	const MoodleLoginService = require('./moodle.js')(app);
    let config = app.get('/auth/account');

    class AuthenticationService {

        // POST /auth/account
        create({email, password}, params) {

            const accountService = app.service('/accounts');
            const userService = app.service('/users');
            const jwtService = app.service('/auth/token');

            return accountService.find({'email': email})
                .then((accounts) => {
                    // 1. Find a fitting account
                    var account = accounts[0] || accounts.data && accounts.data[0];

                    if (!account) {
                        throw new Error('No fitting account found');
                    }

                    return account;
                })
                .then((account) => {
                    // 2. Check if credentials of account are correct
                    var hash = account['password'];

                    if (!hash) {
                        throw new Error('Account record in the database is missing a password');
                    }

                    return new Promise((resolve, reject) => {
                        crypto.compare(password, hash, (error, result) => {
                            // Handle 500 server error.
                            if (error) {
                                return reject(error);
                            }

                            if (!result) {
                                return reject(new Error('Passwords not matching'));
                            }

                            return resolve(account.userId);
                        });
                    });
                }).then((userId) => {
                    // 3. account credentials are correct - get user
                    return userService.get(userId);
                }).then((user) => {
                    // 4. if user found: generate jwt
                    return jwtService.create(user);
                })/*.then((jwt) => {
             // 5. return generated JWT
             resolve(jwt);
             })*/;

        }
    }

    app.use('/auth/account', new AuthenticationService());
	app.use('/auth/moodle', new MoodleLoginService());
    app.configure(authentication(config));
};
