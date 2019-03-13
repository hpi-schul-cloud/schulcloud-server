const util = require('util');


const Strategy = require('passport-strategy');

function CustomStrategy(options, verify) {
	if (typeof options === 'function') {
		verify = options;
		options = {};
	}
	if (!verify) { throw new TypeError('CustomStrategy requires a verify callback'); }

	Strategy.call(this);
	this.name = 'custom';
	this.options = options;
	this.verify = verify;
}

util.inherits(CustomStrategy, Strategy);

CustomStrategy.prototype.authenticate = function authenticate(req, options) {
	const self = this;
	options = options || {};

	function verified(err, user, info) {
		if (err) { return self.error(err); }
		if (!user) { return self.fail(info); }
		return self.success(user, info);
	}

	try {
		return this.verify(req, verified);
	} catch (ex) {
		return self.error(ex);
	}
};

module.exports = CustomStrategy;
