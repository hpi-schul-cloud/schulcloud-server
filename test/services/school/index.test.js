const assert = require('assert');
const chai = require('chai');

const { expect } = chai;

const app = require('../../../src/app');
const { equal: equalIds } = require('../../../src/helper/compare').ObjectId;

const {
	schoolModel: School,
	yearModel: YearModel,
} = require('../../../src/services/school/model');

const { cleanup } = require('../helpers/testObjects')(app);
const { create: createSchool, info: createdSchoolIds } = require('./../helpers/services/schools')(app);


describe('school service', () => {
	it('registered the schools services', () => {
		assert.ok(app.service('schools'));
	});

	describe('create school with or without year', () => {
		let defaultYears = null;
		let sampleYear;
		let sampleSchoolData;
		const schoolService = app.service('/schools');

		before('load data and set samples', async () => {
			defaultYears = await YearModel.find().lean().exec();
			sampleYear = defaultYears[0];
			const school = await createSchool();
			sampleSchoolData = await School.findById(school._id).lean().exec();
			delete sampleSchoolData._id;
		});

		it('create school with currentYear defined explictly', async () => {
			const serviceCreatedSchool = await schoolService.create(sampleSchoolData);
			const { _id: schoolId } = serviceCreatedSchool;
			createdSchoolIds.push(schoolId);
			const out = await schoolService.get(schoolId);
			expect(out, 'school has been saved').to.be.not.null;
			expect(out.currentYear, 'the defined year has been added to the school').to.be.ok;
			expect(equalIds(sampleYear._id, out.currentYear),
				'the defined year has been added to the school').to.be.true;
		});

		it('create school with no currentYear defined that will be added', async () => {
			const serviceCreatedSchool = await schoolService.create(sampleSchoolData);
			const { _id: schoolId } = serviceCreatedSchool;
			createdSchoolIds.push(schoolId);
			const out = await schoolService.get(schoolId);
			expect(out, 'school has been saved').to.be.not.null;
			const { currentYear } = out;
			expect(currentYear, 'the defined year has been added to the school').to.be.ok;
			const foundYear = defaultYears.filter((year) => equalIds(year._id, currentYear));
			expect(foundYear.length, 'the auto added year exists in years').to.be.equal(1);
			// here we could test, we have defaultYear added but however we just need any year
			// to be set and this should not test year logic
		});
	});

	after(cleanup);
});

describe('years service', () => {
	it('registered the years services', () => {
		assert.ok(app.service('years'));
		assert.ok(app.service('gradeLevels'));
	});
});
