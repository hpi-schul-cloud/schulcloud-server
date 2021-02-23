const mongoose = require('mongoose');
const { info, warn } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const System = mongoose.model(
	'systems1576570802025',
	new mongoose.Schema({
		type: { type: String },
	}),
	'systems'
);

const School = mongoose.model(
	'schools1576570802025',
	new mongoose.Schema({
		systems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'system' }],
	}),
	'schools'
);

module.exports = {
	up: async function up() {
		await connect();
		info('Removing all systems with type=local');
		const systems = await System.find({ type: 'local' }).lean().exec();
		await Promise.all(
			systems.map(async (system) => {
				info(`Removing system ${system._id} (${system.alias}) from schools...`);
				await School.updateMany({ systems: system._id }, { $pull: { systems: system._id } });
				info(`Removing system ${system._id} (${system.alias}) from the DB...`);
				await System.deleteOne({ _id: system._id });
				info('Done.');
			})
		);
		info(`${systems.length} systems removed.`);
		await close();
	},

	down: async function down() {
		warn('Not implemented');
	},
};
