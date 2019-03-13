/* eslint-disable */
//toDo: linter
const _ = require('lodash');
const CustomStrategy = require('../custom');
const Verifier = require('./verifier');

const defaults = {
	name: 'system',
	username: '',
	passwort: '',
	systemId: '',
	loginStrategy: '',
	passReqToCallback: true
};

const KEYS = [
	'entity',
	'service',
	'session',
	'passReqToCallback'
];


function init(options = {}) {
	return function () {
		const app = this;
		const _super = app.setup;

		if (!app.passport) {
			throw new Error(`Can not find app.passport. Did you initialize feathers-authentication?`);
		}

		let name = options.name || defaults.name;
		let authOptions = app.get('auth') || {};
		let systemOptions = authOptions[name] || {};

		const systemSettings = _.merge({}, defaults, _.pick(authOptions, KEYS), systemOptions, _.omit(options, ['Verifier']));

		app.setup = function () {
			let result = _super.apply(this, arguments);
			let verifier = new Verifier(app, systemSettings);

			if (!verifier.verify) {
				throw new Error(`Your verifier must implement a 'verify' function. It should have the same signature as a local passport verify callback.`);
			}

			// Register 'system' strategy with passport
			app.passport.use(systemSettings.name, new CustomStrategy(systemSettings, verifier.verify.bind(verifier)));
			app.passport.options(systemSettings.name, systemSettings);

			return result;
		};
	};
}

// Exposed Modules
Object.assign(init, {
	defaults,
	Verifier
});

exports.default = init;
module.exports = exports['default'];
