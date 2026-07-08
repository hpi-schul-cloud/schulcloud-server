const scope = 'additionalInfosTeam';
exports.scope = scope;

exports.set = (hook, key, value) => {
	if (hook[scope] === undefined) {
		hook[scope] = {};
	}
	hook[scope][key] = value;
};

exports.get = (hook, key) => (hook[scope] || {})[key];
