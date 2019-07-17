const { yearModel: Year } = require('../src/services/school/model');

const { connect, close } = require('../src/utils/database');

const YEAR_2019_20 = '2019/20';

module.exports = {
	up: async function up() {
		await connect();
		const year = new Year({
			name: YEAR_2019_20,
		});
		await year.save();
		await close();
	},

	down: async function down() {
		await connect();
		await Year.deleteOne({ name: YEAR_2019_20 }).exec();
		await close();
	},
};
