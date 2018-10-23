const AbstractLDAPStrategy = require('./interface');
const UniventionLDAPStrategy = require('./univention');

const strategies = {
    'univention': UniventionLDAPStrategy
};

/**
 * returns the LDAPStrategy object referenced by the given LDAP config's
 * `provider` attribute
 * @param {LdapConfig} config
 * @return {AbstractLDAPStrategy} an LDAPStrategy object
 * @throws Will throw an error if the given config is invalid or if there is no
 * strategy implemented for the referenced provider
 */
module.exports = function (config) {
    if (config && config.provider && strategies[config.provider]) {
        const LDAPStrategy = strategies[config.provider];
        return new LDAPStrategy(config);
    } else {
        throw new Error('Invalid configuration object');
    }
};
