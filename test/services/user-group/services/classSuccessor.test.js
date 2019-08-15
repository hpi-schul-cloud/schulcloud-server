const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);
const SchoolYearFacade = require('../../../../src/services/school/logic/year');

const classSuccessorService = app.service('classSuccessor');

describe.only('classSuccessor service', () => {
	it('is properly registered the class successor service', () => {
		expect(classSuccessorService).to.not.equal(undefined);
	});

	it('GET works for class without year or gradeLevel', async () => {
		const newClass = await testObjects.createTestClass({ name: 'sonnenklasse' });
		const successor = await classSuccessorService.get(newClass._id);
		expect(successor).to.not.equal(undefined);
		expect(successor.gradeLevel).to.equal(undefined);
		expect(successor.name).to.equal(newClass.name);
		expect(successor.schoolId.toString()).to.equal(newClass.schoolId.toString());
	});

	it('GET works for class with year', async () => {
		const newSchool = await testObjects.createTestSchool();
		const school = await app.service('schools').get(newSchool._id); // necessary to get valid years
		const schoolYears = new SchoolYearFacade(school.years.schoolYears, school);
		const classYear = school.years.lastYear._id;
		const yearAfter = await schoolYears.getNextYearAfter(classYear);

		const newClass = await testObjects.createTestClass({ name: 'mondklasse', schoolId: school._id, year: classYear });
		const successor = await classSuccessorService.get(newClass._id);

		expect(successor).to.not.equal(undefined);
		expect(successor.gradeLevel).to.equal(undefined);
		expect(successor.name).to.equal(newClass.name);
		expect(successor.year.toString()).to.equal(yearAfter._id.toString());
		expect(successor.schoolId.toString()).to.equal(newClass.schoolId.toString());
	});

	it('GET works for class with gradeLevel', async () => {
		const newClass = await testObjects.createTestClass({ name: 'a', gradeLevel: 4 });
		const successor = await classSuccessorService.get(newClass._id);
		expect(successor).to.not.equal(undefined);
		expect(successor.gradeLevel).to.equal(5);
		expect(successor.name).to.equal('a');
		expect(successor.schoolId.toString()).to.equal(newClass.schoolId.toString());
	});

	it('fails when gradeLevel is too high', async () => {
		try {
			const newClass = await testObjects.createTestClass({ name: 'b', gradeLevel: 13 });
			await classSuccessorService.get(newClass._id);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.message).to.equal('there is no grade level higher than 13!');
		}
	});

	it('GET works for class with year and gradeLevel', async () => {
		const newSchool = await testObjects.createTestSchool();
		const school = await app.service('schools').get(newSchool._id); // necessary to get valid years
		const schoolYears = new SchoolYearFacade(school.years.schoolYears, school);
		const classYear = school.years.lastYear._id;
		const yearAfter = await schoolYears.getNextYearAfter(classYear);

		const newClass = await testObjects.createTestClass({
			name: 'c',
			gradeLevel: 6,
			schoolId: school._id,
			year: classYear,
		});
		const successor = await classSuccessorService.get(newClass._id);

		expect(successor).to.not.equal(undefined);
		expect(successor.gradeLevel).to.equal(7);
		expect(successor.name).to.equal(newClass.name);
		expect(successor.year.toString()).to.equal(yearAfter._id.toString());
		expect(successor.schoolId.toString()).to.equal(newClass.schoolId.toString());
	});

	it('GET warns about duplicates');

	it('FIND generates multiple successors');

	it('is accessible as teacher');

	it('is accessible as admin');

	it('fails as student');

	it('fails for class on different school');

	after(async () => {
		await testObjects.cleanup();
	});
});
