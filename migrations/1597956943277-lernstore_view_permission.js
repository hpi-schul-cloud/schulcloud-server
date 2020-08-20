const mongoose = require('mongoose');
const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model('learnstoreroles', new mongoose.Schema({
	name: { type: String, required: true },
	permissions: [{ type: String }],
}, {
	timestamps: true,
}), 'roles');

module.exports = {
	up: async function up() {
		await connect();
		await Roles.updateMany({
			name: {
				$in: [
					'administrator',
					'superhero',
					'teacher',
					'demo',
					'demoTeacher',
					'courseStudent',
					'courseTeacher',
					'courseSubstitutionTeacher',
				],
			},
		}, {
			$addToSet: { permissions: 'LERNSTORE_VIEW' },
		});
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.updateMany({
			name: {
				$in: [
					'administrator',
					'superhero',
					'teacher',
					'demo',
					'demoTeacher',
					'courseStudent',
					'courseTeacher',
					'courseSubstitutionTeacher',
				],
			},
		}, {
			$pull: { permissions: 'LERNSTORE_VIEW' },
		});
		await close();
	},
};
