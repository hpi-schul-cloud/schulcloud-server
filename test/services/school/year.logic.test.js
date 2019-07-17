const chai = require('chai');
// const app = require('../../../src/app');
const yearLogic = require('../../../src/services/school/logic/year');
const { schoolModel: School } = require('../../../src/services/school/model');

const { expect } = chai;

const testSchoolId = '0000d186816abba584714c5f';

let defaultYears;
let schoolSettings;

describe.only('school year logic', async () => {
	before('load data', async () => {
		defaultYears = await yearLogic.defaultYears();
		schoolSettings = await yearLogic.schoolSettings(testSchoolId);
	});

	it('default years, and current/next year exist', () => {
		expect(defaultYears.length).is.greaterThan(1);
		const nowAsYear = String(new Date().getFullYear());
		expect(defaultYears
			.filter(year => year.name.startsWith(nowAsYear)).length).to.be.equal(1,
			'the next school year should be added here and to all running systems');
	});

	it('set custom year dates for testSchool', async () => {
		const testSchool = await School.findById(testSchoolId).exec();
		expect(testSchool).is.not.null('test school could not be fetched from database');
	});
});
