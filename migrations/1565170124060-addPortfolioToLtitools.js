const { connect, close } = require('../src/utils/database');
const LtiTool = require('../src/services/ltiTool/model');

module.exports = {
	up: async function up() {
		await connect();
		const portfolio = new LtiTool({
			name: 'Portfolio',
			url: 'https://portfolio.niedersachsen.cloud/oauth/schulcloud/login',
			isLocal: true,
			isTemplate: false,
			key: 'none',
			secret: 'none',
			privacy_permission: 'pseudonymous',
			oAuthClientId: 'portfolio',
			friendlyUrl: 'portfolio',
		});
		await portfolio.save();
		await close();
	},

	down: async function down() {
		await connect();
		await LtiTool.findOneAndRemove({
			friendlyUrl: 'portfolio',
		}).exec();
		await close();
	},
};
