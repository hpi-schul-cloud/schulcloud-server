let scope = 'additionalInfosTeam'

exports.set = (hook, key, value) => {
    if (hook[scope] === undefined)
        hook[scope] = {};
    hook[scope][key] = value;
}

exports.get = (hook, key) => {
    return (hook[scope] || {})[key];
}