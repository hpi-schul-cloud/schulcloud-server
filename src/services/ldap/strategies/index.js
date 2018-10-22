const UniventionLDAPStrategy = require('./univention');

const strategies = {
    'univention': UniventionLDAPStrategy
};

module.exports = function (config) {
    if (config && config.provider && strategies[config.provider]) {
        const LDAPStrategy = strategies[config.provider];
        return new LDAPStrategy(config);
    } else {
        throw new Error('Invalid configuration object');
    }
};
