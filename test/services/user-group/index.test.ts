import { expect } from 'chai';
import appPromise from '../../../src/app';
import testObjectsImport from '../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);
import loginImport from '../helpers/services/login'; 
const { generateRequestParamsFromUser } = loginImport(appPromise);
import compareImport from '../../../src/helper/compare'; 
const { equal: equalIds } = compareImport.ObjectId;

describe('classes service', () => {
	let app;
	let classesService;
	let server;

	before(async () => {
		app = await appPromise;
		classesService = app.service('/classes');
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('is properly registered', () => {
		expect(classesService).to.not.equal(undefined);
	});

	describe('find route', () => {
		const createdIds = [];

		after(async () => {
			await testObjects.classes.removeMany(createdIds);
		});

		afterEach(testObjects.cleanup);

		it('should allow teachers and admins to find all classes', async () => {
			const teacherUser = await testObjects.createTestUser({ roles: ['teacher'] });
			const adminUser = await testObjects.createTestUser({
				roles: ['administrator'],
				schoolId: teacherUser.schoolId,
			});

			const classes = [
				await testObjects.createTestClass({
					name: Math.random(),
					teacherIds: [adminUser._id],
					schoolId: teacherUser.schoolId,
				}),
				await testObjects.createTestClass({
					name: Math.random(),
					teacherIds: [adminUser._id],
					schoolId: teacherUser.schoolId,
				}),
				await testObjects.createTestClass({
					name: Math.random(),
					schoolId: teacherUser.schoolId,
				}),
			];

			await Promise.all(
				[teacherUser, adminUser].map(async (role) => {
					const params = {
						query: {},
						...(await generateRequestParamsFromUser(role)),
					};
					const { data } = await classesService.find(params);
					expect(data.length).to.equal(classes.length);
					// all created classes should be in the response:
					expect(classes.reduce((agg, cur) => agg && data.some((d) => equalIds(d._id, cur._id)), true)).to.equal(true);
				})
			);
		}).timeout(4000);

		it('should allow students to only find classes they participate in', async () => {
			const studentUser = await testObjects.createTestUser({ roles: ['student'] });

			const classes = [
				await testObjects.createTestClass({
					name: Math.random(),
					schoolId: studentUser.schoolId,
					userIds: [studentUser._id],
				}),
				await testObjects.createTestClass({
					name: Math.random(),
					schoolId: studentUser.schoolId,
				}),
				await testObjects.createTestClass({
					name: Math.random(),
				}),
			];

			const params = {
				query: {},
				...(await generateRequestParamsFromUser(studentUser)),
			};
			const { data } = await classesService.find(params);
			expect(data.length).to.equal(1);
			expect(data[0]._id.toString()).to.equal(classes[0]._id.toString());
		});

		it('should display the classes in correct order', async () => {
			const adminUser = await testObjects.createTestUser({ roles: ['administrator'] });

			const classes = [
				await testObjects.createTestClass({
					name: 'C',
				}),
				await testObjects.createTestClass({
					name: 'B',
				}),
				await testObjects.createTestClass({
					name: 'A',
				}),
			];

			const adminParams = {
				query: {},
				...(await generateRequestParamsFromUser(adminUser)),
			};

			const { data } = await classesService.find(adminParams);
			expect(data.length).to.equal(3);
			expect(data[0].displayName).to.equal(classes[2].displayName);
			expect(data[1].displayName).to.equal(classes[1].displayName);
			expect(data[2].displayName).to.equal(classes[0].displayName);
		});

		it('should display the classes in correct order when gradelevel is included', async () => {
			const adminUser = await testObjects.createTestUser({ roles: ['administrator'] });

			const classes = [
				await testObjects.createTestClass({
					name: 'C',
					gradeLevel: 2,
				}),
				await testObjects.createTestClass({
					name: 'B',
					gradeLevel: 9,
				}),
				await testObjects.createTestClass({
					name: 'A',
					gradeLevel: 7,
				}),
			];

			const adminParams = {
				query: {},
				...(await generateRequestParamsFromUser(adminUser)),
			};
			const { data } = await classesService.find(adminParams);

			expect(data.length).to.equal(3);
			expect(data[0].displayName).to.equal(classes[0].displayName);
			expect(data[1].displayName).to.equal(classes[2].displayName);
			expect(data[2].displayName).to.equal(classes[1].displayName);
		});

		it('should display the classes in correct order when years are included', async () => {
			const { _id } = await testObjects.createTestSchool();
			const school = await app.service('schools').get(_id);
			const adminUser = await testObjects.createTestUser({ roles: ['administrator'] });

			const classes = [
				await testObjects.createTestClass({
					name: 'A',
					year: school.years.schoolYears[0],
				}),
				await testObjects.createTestClass({
					name: 'A',
					year: school.years.schoolYears[1],
				}),
				await testObjects.createTestClass({
					name: 'B',
					year: school.years.schoolYears[0],
				}),
			];

			const adminParams = {
				query: {},
				...(await generateRequestParamsFromUser(adminUser)),
			};
			const { data } = await classesService.find(adminParams);

			expect(data.length).to.equal(3);
			expect(data[0].displayName).to.equal(classes[0].displayName);
			expect(data[1].displayName).to.equal(classes[2].displayName);
			expect(data[2].displayName).to.equal(classes[1].displayName);
		});

		it('CREATE patches successor ID in predecessor class', async () => {
			const orgClass = await classesService.create({
				name: 'sonnenklasse 1',
				schoolId: '5f2987e020834114b8efd6f8',
			});
			createdIds.push(orgClass._id);
			const successorClass = await classesService.create({
				name: 'sonnenklasse 2',
				schoolId: '5f2987e020834114b8efd6f8',
				predecessor: orgClass._id,
			});
			createdIds.push(successorClass._id);
			const updatedOrgClass = await classesService.get(orgClass._id);
			expect(updatedOrgClass.name).to.equal('sonnenklasse 1');
			expect(successorClass.name).to.equal('sonnenklasse 2');
			expect(updatedOrgClass.successor.toString()).to.equal(successorClass._id.toString());
		});
	});
});
