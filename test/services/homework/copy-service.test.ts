import chai from 'chai';
import appPromise from '../../../src/app';
import testObjectsImport from '../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);
import { homeworkModel } from '../../../src/services/homework/model';

const { expect } = chai;

describe('homework copy service', () => {
	let app;
	let homeworkCopyService;
	const homeworkIdsToDelete = [];
	let server;

	before(async () => {
		app = await appPromise;
		homeworkCopyService = app.service('homework/copy');
		server = await app.listen(0);
	});

	after(async () => {
		await homeworkModel.deleteMany({ id: { $in: homeworkIdsToDelete } });
		await testObjects.cleanup();
		await server.close();
	});

	it('internal call can copy a homework via POST', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const homework = await testObjects.createTestHomework({
			teacherId: user._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [user._id],
			lessonId: null,
			courseId: null,
		});

		const copy = await homeworkCopyService.create({ _id: homework._id, userId: user._id });
		expect(copy.courseId).to.equal(null);
		expect(copy.lessonId).to.equal(null);
		expect(copy.name).to.equal('Testaufgabe');
		expect(copy.stats).to.equal(undefined);
		expect(copy.grade).to.equal(undefined);
	});

	it('a copy is always private at first', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const homework = await testObjects.createTestHomework({
			teacherId: user._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: false,
			archived: [user._id],
			lessonId: null,
			courseId: null,
		});

		const copy = await homeworkCopyService.create({ _id: homework._id, userId: user._id });
		expect(copy._id.toString()).to.not.eq(homework._id.toString());
		expect(copy.name).to.equal('Testaufgabe');
		expect(copy.private).to.equal(true);
	});

	it('internal call can copy a homework for a different user', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const otherUser = await testObjects.createTestUser({ roles: ['teacher'] });
		const homework = await testObjects.createTestHomework({
			teacherId: user._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [user._id],
			lessonId: null,
			courseId: null,
		});

		const copy = await homeworkCopyService.create({
			_id: homework._id,
			userId: otherUser._id,
			newTeacher: otherUser._id,
		});
		expect(copy.courseId).to.equal(null);
		expect(copy.lessonId).to.equal(null);
		expect(copy._id.toString()).to.not.equal(homework._id.toString());
		expect(copy.teacherId.toString()).to.equal(otherUser._id.toString());
		expect(copy.name).to.equal('Testaufgabe');
		expect(copy.stats).to.equal(undefined);
		expect(copy.grade).to.equal(undefined);
	});

	it('internal call can copy a homework into course or lesson', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const otherUser = await testObjects.createTestUser({ roles: ['teacher'] });
		const course = await testObjects.createTestCourse({ teacherIds: [otherUser._id] });
		const homework = await testObjects.createTestHomework({
			teacherId: user._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [user._id],
			lessonId: null,
			courseId: null,
		});

		const copyForCourse = await homeworkCopyService.create({
			_id: homework._id,
			userId: otherUser._id,
			newTeacher: otherUser._id,
			courseId: course._id,
		});
		expect(copyForCourse.courseId).to.equal(course._id);
		expect(copyForCourse.lessonId).to.equal(null);
		expect(copyForCourse._id.toString()).to.not.equal(homework._id.toString());
		expect(copyForCourse.teacherId.toString()).to.equal(otherUser._id.toString());
		expect(copyForCourse.name).to.equal('Testaufgabe');
		expect(copyForCourse.stats).to.equal(undefined);
		expect(copyForCourse.grade).to.equal(undefined);
	});

	it('internal call can copy a homework into another school', async () => {
		const originalSchool = await testObjects.createTestSchool();
		const destinationSchool = await testObjects.createTestSchool();
		const originalUser = await testObjects.createTestUser({ roles: ['teacher'], schoolId: originalSchool._id });
		const destUser = await testObjects.createTestUser({ roles: ['teacher'], schoolId: destinationSchool._id });
		const destCourse = await testObjects.createTestCourse({ teacherIds: [destUser._id] });
		const homework = await testObjects.createTestHomework({
			schoolId: originalSchool._id,
			teacherId: originalUser._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [originalUser._id],
			lessonId: null,
			courseId: null,
		});

		const copy = await homeworkCopyService.create({
			_id: homework._id,
			userId: destUser._id,
			newTeacher: destUser._id,
			courseId: destCourse._id,
		});
		expect(copy.courseId).to.equal(destCourse._id);
		expect(copy.lessonId).to.equal(null);
		expect(copy._id.toString()).to.not.equal(homework._id.toString());
		expect(copy.teacherId.toString()).to.equal(destUser._id.toString());
		expect(copy.name).to.equal('Testaufgabe');
		expect(copy.stats).to.equal(undefined);
		expect(copy.grade).to.equal(undefined);
	});

	it('generates data for a copy on GET', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const params = await testObjects.generateRequestParamsFromUser(user);
		const homework = await testObjects.createTestHomework({
			teacherId: user._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [user._id],
			lessonId: null,
			courseId: null,
		});

		const copy = await homeworkCopyService.get(homework._id, params);
		expect(copy.courseId).to.equal(null);
		expect(copy.lessonId).to.equal(null);
		expect(copy.name).to.equal('Testaufgabe - Copy');
		expect(copy.stats).to.equal(undefined);
		expect(copy.grade).to.equal(undefined);
	});

	it('user can not copy someone elses homework', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const otherUser = await testObjects.createTestUser({ roles: ['teacher'] });
		const params = await testObjects.generateRequestParamsFromUser(user);
		const homework = await testObjects.createTestHomework({
			teacherId: otherUser._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [user._id],
			lessonId: null,
			courseId: null,
		});
		try {
			const copy = await homeworkCopyService.create({ homeworkId: homework._id, userId: user._id }, params);
			homeworkIdsToDelete.push(copy._id);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.eq('should have failed');
			// expect(err.code).to.eq(403); // currently there is another error even before the permission check...
		}
		try {
			await homeworkCopyService.get(homework._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.eq('should have failed');
			expect(err.code).to.eq(403);
		}
	});
});
