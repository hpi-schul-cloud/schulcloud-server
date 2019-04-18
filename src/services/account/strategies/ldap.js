const errors = require('@feathersjs/errors');

const AbstractLoginStrategy = require('./interface.js');

class LdapLoginStrategy extends AbstractLoginStrategy {
    constructor(app) {
        super();
        this.app = app;
    }

    login({ username, password }, system, schoolId) {
        const { app } = this;
        const ldapService = app.service('ldap');
        const lowerUsername = username.toLowerCase();

        return app.service('schools').get(schoolId)
            .then(school => app.service('accounts').find({ query: { username: lowerUsername } })
                .then(([account]) => app.service('users').get(account.userId))
                .then(user => ldapService.authenticate(system, user.ldapDn, password)));
    }
}

module.exports = LdapLoginStrategy;
