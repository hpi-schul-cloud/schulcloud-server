import { expect } from 'chai';
import appPromise from '../../../../src/app';
import testObjectsImport from '../../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);
import loginImport from '../../helpers/services/login'; 
const { generateRequestParamsFromUser } = loginImport(appPromise);
import SchoolYearFacade from '../../../../src/services/school/logic/year';
import classSuccessorServiceClass from '../../../../src/services/user-group/services/classSuccessor';

describe('classSuccessor service', () => {
	let app;
	let classSuccessorService;
	let server;

	before(async () => {
		app = await appPromise;
		classSuccessorService = app.service('classes/successor');
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

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

		const newClass = await testObjects.createTestClass({
			name: 'mondklasse',
			schoolId: school._id,
			year: classYear,
		});
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

	it('GET informs about duplicates', async () => {
		const name = `klasse ${Date.now()}`;
		const oldClass = await testObjects.createTestClass({ name });
		const newClass = await testObjects.createTestClass({ name });

		const successor = await classSuccessorService.get(newClass._id);
		expect(successor).to.not.equal(undefined);
		expect(successor.gradeLevel).to.equal(undefined);
		expect(successor.name).to.equal(newClass.name);
		expect(successor.schoolId.toString()).to.equal(newClass.schoolId.toString());
		expect(successor.duplicates.map((d) => d.toString())).to.include(oldClass._id.toString());
	});

	it('only includes duplicates in the same year', async () => {
		const newSchool = await testObjects.createTestSchool();
		const school = await app.service('schools').get(newSchool._id); // necessary to get valid years
		const schoolYears = new SchoolYearFacade(school.years.schoolYears, school);
		const classYear = school.years.lastYear._id;
		const yearAfter = await schoolYears.getNextYearAfter(classYear);

		const name = `klasse ${Date.now()}`;
		const classThisYear = await testObjects.createTestClass({ name, schoolId: school._id, year: classYear });
		const classYearAfter = await testObjects.createTestClass({ name, schoolId: school._id, year: yearAfter });
		const newClass = await testObjects.createTestClass({ name, schoolId: school._id, year: classYear });
		const successor = await classSuccessorService.get(newClass._id);

		expect(successor).to.not.equal(undefined);
		expect(successor.name).to.equal(newClass.name);
		expect(successor.year.toString()).to.equal(yearAfter._id.toString());
		const duplicates = successor.duplicates.map((d) => d.toString());
		expect(duplicates).to.include(classYearAfter._id.toString());
		expect(duplicates).not.to.include(classThisYear._id.toString());
	});

	it('only includes duplicates with equal grade level', async () => {
		const name = `klasse ${Date.now()}`;
		const classoldGrade = await testObjects.createTestClass({ name, gradeLevel: 1 });
		const classNextGrade = await testObjects.createTestClass({ name, gradeLevel: 2 });
		const newClass = await testObjects.createTestClass({ name, gradeLevel: 1 });

		const successor = await classSuccessorService.get(newClass._id);
		expect(successor).to.not.equal(undefined);
		expect(successor.gradeLevel).to.equal(2);
		expect(successor.name).to.equal(newClass.name);
		expect(successor.schoolId.toString()).to.equal(newClass.schoolId.toString());
		const duplicates = successor.duplicates.map((d) => d.toString());
		expect(duplicates).to.include(classNextGrade._id.toString());
		expect(duplicates).not.to.include(classoldGrade._id.toString());
	});

	it('FIND generates multiple successors', async () => {
		const gClass = await testObjects.createTestClass({ name: 'g', gradeLevel: 7 });
		const eClass = await testObjects.createTestClass({ name: 'e', gradeLevel: 6 });
		const result = await classSuccessorService.find({ query: { classIds: [gClass._id, eClass._id] } });
		expect(Array.isArray(result)).to.equal(true);
		expect(result.length).to.equal(2);
	});

	it('FIND should return an error if no array of classIds is passed', async () => {
		try {
			await classSuccessorService.find({ query: {} });
			throw new Error('should have failed');
		} catch (error) {
			expect(error.message).to.not.equal('should have failed');
			expect(error.message).to.equal('please pass an array of classIds in query.classIds');
			expect(error.code).to.equal(400);
		}
	});

	it('is accessible as teacher', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const params = await generateRequestParamsFromUser(teacher);
		const newClass = await testObjects.createTestClass({ name: 'lieblingsklasse' });
		const successor = await classSuccessorService.get(newClass._id, params);
		expect(successor).to.not.equal(undefined);
		expect(successor.gradeLevel).to.equal(undefined);
		expect(successor.name).to.equal(newClass.name);
		expect(successor.schoolId.toString()).to.equal(newClass.schoolId.toString());
	});

	it('is accessible as admin', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await generateRequestParamsFromUser(admin);
		const newClass = await testObjects.createTestClass({ name: 'problemklasse' });
		const successor = await classSuccessorService.get(newClass._id, params);
		expect(successor).to.not.equal(undefined);
		expect(successor.gradeLevel).to.equal(undefined);
		expect(successor.name).to.equal(newClass.name);
		expect(successor.schoolId.toString()).to.equal(newClass.schoolId.toString());
	});

	it('fails as student', async () => {
		try {
			const admin = await testObjects.createTestUser({ roles: ['student'] });
			const params = await generateRequestParamsFromUser(admin);
			const newClass = await testObjects.createTestClass({ name: 'cooleklasse' });
			await classSuccessorService.get(newClass._id, params);
			throw new Error('should have failed');
		} catch (error) {
			expect(error.message).to.not.equal('should have failed');
			expect(error.message).to.equal("You don't have one of the permissions: CLASS_CREATE.");
			expect(error.code).to.equal(403);
		}
	});

	it('fails for class on different school', async () => {
		try {
			const userSchool = await testObjects.createTestSchool();
			const classSchool = await testObjects.createTestSchool();
			const teacher = await testObjects.createTestUser({ schoolId: userSchool._id, roles: ['teacher'] });
			const params = await generateRequestParamsFromUser(teacher);
			const newClass = await testObjects.createTestClass({ name: 'fremdenklasse', schoolId: classSchool._id });
			await classSuccessorService.get(newClass._id, params);
			throw new Error('should have failed');
		} catch (error) {
			expect(error.message).to.not.equal('should have failed');
			expect(error.message).to.equal('You do not have valid permissions to access this.');
			expect(error.code).to.equal(403);
		}
	});

	it('if a successor is created, the original class is updated.', async () => {
		let oldClass = await testObjects.createTestClass({ name: 'a', gradeLevel: 4 });
		const successor = await classSuccessorService.get(oldClass._id);
		const newClass = await app.service('classes').create(successor);
		oldClass = await app.service('classes').get(oldClass._id);
		expect(oldClass.successor.toString()).to.equal(newClass._id.toString());
		await app.service('classes').remove(newClass._id);
	});

	it('OnClassRemove updates any existing predecessors.', async () => {
		let oldClass = await testObjects.createTestClass({ name: 'f', gradeLevel: 4 });
		const newClass = await testObjects.createTestClass({ name: 'fakesuccessor' });
		oldClass = await app.service('classes').patch(oldClass._id, { successor: newClass._id });
		// call the eventListener directly. apply() calls the function, with 'this' set to the first parameter.
		// that emulates the event getting triggered.
		await classSuccessorServiceClass.onClassRemoved.apply({ app }, [newClass]);
		oldClass = await app.service('classes').get(oldClass._id);
		expect(oldClass._id).to.not.be.undefined;
		expect(oldClass.successor).to.be.undefined;
	});

	after(testObjects.cleanup);
});
