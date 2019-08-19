const defaultConfig = require('./default.json');

let envConfig;

switch (process.env.NODE_ENV) {
	case 'test':
		envConfig = require('./test.json');
		break;
	case 'production':
		envConfig = require('./production.json');
		break;
	case 'development':
	case 'default':
	default:
		envConfig = require('./development.json');
		break;
}

const prefix = 'MS_EDTR_';

const camelCase = input => input.toLowerCase().replace(/_(.)/g, (match, group1) => group1.toUpperCase());

const prepareEnv = (env) => {
	const refObject = {};
	Object.keys(env).forEach((key) => {
		if (key.startsWith(prefix)) {
			const slice = key.slice(prefix.length, key.length);
			refObject[camelCase(slice)] = env[key];
		}
	});

	return refObject;
};

const prepareConfig = (base, system, env) => {
	const config = {};

	Object.keys(base).forEach((key) => {
		config[key] = env[key] || system[key] || base[key];
	});

	return config;
};


module.exports = prepareConfig(defaultConfig, envConfig, prepareEnv(process.env));