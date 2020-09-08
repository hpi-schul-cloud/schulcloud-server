const mongoose = require('mongoose');

const { info } = require('../src/logger');
const { connect, close } = require('../src/utils/database');

const Teams = mongoose.model(
	'oldTeamModel',
	new mongoose.Schema({
		ltiToolIds: [{ type: mongoose.Schema.Types.ObjectId }],
		startDate: { type: Date },
		untilDate: { type: Date },
		times: { type: Object },
	}),
	'teams'
);

module.exports = {
	up: async function up() {
		await connect();
		const res = await Teams.updateMany(
			{},
			{
				$unset: {
					ltiToolIds: '',
					startDate: '',
					untilDate: '',
					times: '',
				},
			}
		);
		info('Deleted unused team infos', res);
		await close();
	},

	down: async function down() {
		return null;
	},
};
