const { expect } = require('chai');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);

const classesService = app.service('/classes');

describe('classes service', () => {
	it('is properly registered', () => {
		expect(classesService).to.not.equal(undefined);
	});

	describe('find route', () => {
		let server;

		before((done) => {
			server = app.listen(0, done);
		});

		after((done) => {
			server.close(done);
		});

		it('should allow teachers and admins to find all classes', async () => {
			const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: teacher.schoolId });

			const classes = [
				await testObjects.createTestClass({
					name: Math.random(),
					teacherIds: [teacher._id],
					schoolId: teacher.schoolId,
				}),
				await testObjects.createTestClass({
					name: Math.random(),
					teacherIds: [admin._id],
					schoolId: teacher.schoolId,
				}),
				await testObjects.createTestClass({
					name: Math.random(),
					schoolId: teacher.schoolId,
				}),
			];

			await Promise.all([teacher, admin].map(async (role) => {
				const params = {
					query: {},
					...await generateRequestParamsFromUser(role),
				};
				const { data } = await classesService.find(params);
				expect(data.length).to.equal(classes.length);
				// all created classes should be in the response:
				expect(classes.reduce(
					(agg, cur) => agg && data.some((d) => d._id.toString() === cur._id.toString()),
					true,
				)).to.equal(true);
			}));
		}).timeout(4000);

		it('should allow students to only find classes they participate in', async () => {
			const student = await testObjects.createTestUser({ roles: ['student'] });

			const classes = [
				await testObjects.createTestClass({
					name: Math.random(),
					schoolId: student.schoolId,
					userIds: [student._id],
				}),
				await testObjects.createTestClass({
					name: Math.random(),
					schoolId: student.schoolId,
				}),
				await testObjects.createTestClass({
					name: Math.random(),
				}),
			];

			const params = {
				query: {},
				...await generateRequestParamsFromUser(student),
			};
			const { data } = await classesService.find(params);
			expect(data.length).to.equal(1);
			expect(data[0]._id.toString()).to.equal(classes[0]._id.toString());
		});


		it('CREATE patches successor ID in predecessor class', async () => {
			const orgClass = await app.service('classes').create({
				name: 'sonnenklasse 1',
				schoolId: '0000d186816abba584714c5f',
			});
			const successorClass = await app.service('classes').create({
				name: 'sonnenklasse 2',
				schoolId: '0000d186816abba584714c5f',
				predecessor: orgClass._id,
			});
			const updatedOrgClass = await classesService.get(orgClass._id);
			expect(updatedOrgClass.name).to.equal('sonnenklasse 1');
			expect(successorClass.name).to.equal('sonnenklasse 2');
			expect(updatedOrgClass.successor.toString()).to.equal(successorClass._id.toString());
		});

		afterEach(testObjects.cleanup);
	});
});
