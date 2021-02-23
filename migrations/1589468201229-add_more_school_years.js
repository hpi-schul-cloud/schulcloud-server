const mongoose = require('mongoose');
const { info, warning } = require('../src/logger');

const { connect, close } = require('../src/utils/database');
const yearLogic = require('../src/services/school/logic/year');

const YEARS_TO_ADD = ['2021/22', '2022/23', '2023/24', '2024/25', '2025/26'];

const yearSchema = new mongoose.Schema({
	name: { type: String, required: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
});

const YearModel = mongoose.model('year3244382362348795', yearSchema, 'years');

const createYear = (year) =>
	new YearModel({
		name: year,
		startDate: yearLogic.getDefaultStartDate(year),
		endDate: yearLogic.getDefaultEndDate(year),
	});

module.exports = {
	up: async function up() {
		await connect();
		const chain = [];
		const existingYears = await YearModel.find().where('name').in(YEARS_TO_ADD).exec();
		if (existingYears.length > 0) {
			warning(`some year already has been created: ${existingYears}`);
		} else {
			for (const year of YEARS_TO_ADD) {
				info(`processing ${year}`);
				const createdYear = createYear(year);
				await createdYear.save();
				chain.push(createdYear);
				info(`the year ${year} was created successfully`);
			}
		}

		await Promise.all(chain);
		info('Done.');
		await close();
	},

	down: async function down() {
		await connect();
		await YearModel.deleteMany({
			name: {
				$in: YEARS_TO_ADD,
			},
		});
		await close();
	},
};
