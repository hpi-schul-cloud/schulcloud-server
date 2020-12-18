import { expect } from 'chai';
import { SC_TITLE } from '../../../../../config/globals';
import appPromise from '../../../../../src/app';
import MailService from '../../../../../src/services/helpers/service.js';
import roleModel from '../../../../../src/services/role/model.js';
import CSVSyncer from '../../../../../src/services/sync/strategies/CSVSyncer';
import { userModel } from '../../../../../src/services/user/model';
import loginImport from '../../../helpers/services/login';
import schoolsImport from '../../../helpers/services/schools';
import usersImport from '../../../helpers/services/users';
import { create as createYear } from '../../../helpers/services/years';
import testObjectsImport from '../../../helpers/testObjects';
import { deleteUser, MockEmailService } from './helper';
import classes from '../../../helpers/services/classes';

const testObjects = testObjectsImport(appPromise);
const { generateRequestParamsFromUser } = loginImport(appPromise);
const { create: createUser } = usersImport(appPromise);
const { create: createSchool } = schoolsImport(appPromise);
const {
	createByName: createClass,
	findOneByName: findClass,
	findByName: findClasses,
	deleteByName: deleteClass,
} = classes(appPromise);

describe('CSVSyncer Integration', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	describe('Scenario 0 - Missing authentication', () => {
		const scenarioParams = {
			query: {
				target: 'csv',
				school: testObjects.options.schoolId,
				role: 'student',
			},
			provider: 'rest',
		};
		const scenarioData = {
			data: 'firstName,lastName,email\nPeter,Pan,peter@pan.de',
		};

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should fail due to mising authentication', async () => {
			try {
				await app.service('sync').create(scenarioData, scenarioParams);
			} catch (err) {
				expect(err.message).to.equal('Not authenticated');
			}
		});
	});

	describe('Scenario 1 - Importing a single student without classes', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const SCENARIO_EMAIL = 'peter@pan.de';

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'student',
			};
			scenarioData = {
				data: `firstName,lastName,email\nPeter,Pan,${SCENARIO_EMAIL}`,
			};
		});

		after(testObjects.cleanup);

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import a single student without a class', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(true);
			expect(stats.users.successful).to.equal(1);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(0);
			expect(stats.classes.failed).to.equal(0);

			const users = await userModel.find({
				email: SCENARIO_EMAIL,
			});
			expect(users.length).to.equal(1);
			const [role] = await roleModel.find({
				_id: users[0].roles[0],
			});
			expect(role.name).to.equal('student');
		});
	});

	describe('Scenario 2 - Importing teachers', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const TEACHER_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de'];

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'teacher',
			};
			scenarioData = {
				data:
					'firstName,lastName,email\n' +
					`Peter,Pan,${TEACHER_EMAILS[0]}\n` +
					`Peter,Lustig,${TEACHER_EMAILS[1]}\n` +
					`Test,Testington,${TEACHER_EMAILS[2]}\n`,
			};
		});

		after(async () => {
			await testObjects.cleanup();
			await deleteUser(TEACHER_EMAILS[0]);
			await deleteUser(TEACHER_EMAILS[1]);
			await deleteUser(TEACHER_EMAILS[2]);
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import three teachers without a class', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(true);
			expect(stats.users.successful).to.equal(3);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(0);
			expect(stats.classes.failed).to.equal(0);

			const users = await userModel.find({
				email: { $in: TEACHER_EMAILS },
			});
			expect(users.length).to.equal(3);
			const [role] = await roleModel.find({
				_id: users[0].roles[0],
			});
			expect(role.name).to.equal('teacher');
		});
	});

	describe('Scenario 3 - Importing students with classes', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const STUDENT_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de', 'd@e.de', 'e@f.de'];

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'student',
			};
			scenarioData = {
				data:
					'firstName,lastName,email,class\n' +
					`Turanga,Leela,${STUDENT_EMAILS[0]},\n` +
					`Dr. John A.,Zoidberg,${STUDENT_EMAILS[1]},1a+1a\n` +
					`Amy,Wong,${STUDENT_EMAILS[2]},1a\n` +
					`Philip J.,Fry,${STUDENT_EMAILS[3]},1b+2b\n` +
					`Bender Bending,Rodriguez,${STUDENT_EMAILS[4]},2b+2c\n`,
			};
		});

		after(async () => {
			await Promise.all(STUDENT_EMAILS.map((email) => deleteUser(email)));
			await Promise.all(
				[
					['1', 'a'],
					['1', 'b'],
					['2', 'b'],
					['2', 'c'],
				].map((klass) => deleteClass(klass))
			);
			await testObjects.cleanup();
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import five students in different classes', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(true);
			expect(stats.users.successful).to.equal(5);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(6);
			expect(stats.classes.created).to.equal(4);
			expect(stats.classes.updated).to.equal(2);
			expect(stats.classes.failed).to.equal(0);

			const classes = await Promise.all(
				STUDENT_EMAILS.map(async (email) => {
					const [user] = await userModel.find({ email });
					const [role] = await roleModel.find({ _id: user.roles[0] });
					expect(role.name).to.equal('student');
					return app.service('classes').find({
						query: { userIds: user._id },
						paginate: false,
					});
				})
			);

			expect(classes[0].length).to.equal(0);
			expect(classes[1].length).to.equal(1);
			expect(classes[1][0].gradeLevel).to.equal(1);
			expect(classes[1][0].name).to.equal('a');
			expect(classes[2].length).to.equal(1);
			expect(classes[2][0].gradeLevel).to.equal(1);
			expect(classes[2][0].name).to.equal('a');
			expect(classes[1][0]._id).not.to.equal(undefined);
			expect(classes[1][0]._id.toString()).to.equal(classes[2][0]._id.toString());
			expect(classes[3].length).to.equal(2);
			expect(classes[4].length).to.equal(2);

			const studentLastNames = async (student) => {
				const [user] = await app.service('users').find({
					query: {
						_id: student,
					},
					paginate: false,
				});
				return user.lastName;
			};

			const class1a = await findClass(['1', 'a']);
			const class1astudents = await Promise.all(class1a.userIds.map(studentLastNames));
			expect(class1astudents).to.include('Wong');
			expect(class1astudents).to.include('Zoidberg');

			const class2b = await findClass(['2', 'b']);
			const class2bstudents = await Promise.all(class2b.userIds.map(studentLastNames));
			expect(class2bstudents).to.include('Fry');
			expect(class2bstudents).to.include('Rodriguez');
		});
	});

	describe('Scenario 4 - Importing teachers into existing classes', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const EXISTING_CLASSES = [
			['1', 'a'],
			[undefined, 'SG1'],
			['12', '/3'],
		];
		const TEACHER_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de', 'd@e.de', 'e@f.de'];

		before(async function before() {
			this.timeout(5000);
			await Promise.all(EXISTING_CLASSES.map((klass) => createClass([...klass, SCHOOL_ID])));

			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'teacher',
			};
			scenarioData = {
				data:
					'firstName,lastName,email,class\n' +
					`Jonathan 'Jack',O'Neill,${TEACHER_EMAILS[0]},1a\n` +
					`Dr. Samantha 'Sam',Carter,${TEACHER_EMAILS[1]},1a+SG1\n` +
					`Daniel,Jackson,${TEACHER_EMAILS[2]},Archeology\n` +
					`Teal'c,of Chulak,${TEACHER_EMAILS[3]},SG1\n` +
					`George,Hammond,${TEACHER_EMAILS[4]},12/3\n`,
			};
		});

		after(async () => {
			await Promise.all(TEACHER_EMAILS.map((email) => deleteUser(email)));
			await Promise.all(EXISTING_CLASSES.map((klass) => deleteClass(klass)));
			await deleteClass([undefined, 'Archeology']);
			await testObjects.cleanup();
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import five teachers into three existing classes', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(true);
			expect(stats.users.successful).to.equal(5);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(6);
			expect(stats.classes.created).to.equal(1);
			expect(stats.classes.updated).to.equal(5);
			expect(stats.classes.failed).to.equal(0);

			await Promise.all(
				TEACHER_EMAILS.map(async (email) => {
					const [user] = await userModel.find({ email });
					const [role] = await roleModel.find({ _id: user.roles[0] });
					expect(role.name).to.equal('teacher');
				})
			);

			const teacherLastNames = async (teacher) => {
				const [user] = await app.service('users').find({
					query: {
						_id: teacher,
					},
					paginate: false,
				});
				return user.lastName;
			};

			const sg1 = await findClass([undefined, 'SG1']);
			expect(sg1.teacherIds.length).to.equal(2);
			const sg1teachers = await Promise.all(sg1.teacherIds.map(teacherLastNames));
			expect(sg1teachers).to.include('Carter');
			expect(sg1teachers).to.include('of Chulak');

			const class1a = await findClass(['1', 'a']);
			expect(class1a.teacherIds.length).to.equal(2);
			const class1ateachers = await Promise.all(class1a.teacherIds.map(teacherLastNames));
			expect(class1ateachers).to.include('Carter');
			expect(class1ateachers).to.include("O'Neill");

			const archeology = await findClass([undefined, 'Archeology']);
			expect(archeology.teacherIds.length).to.equal(1);
			const archeologyteachers = await Promise.all(archeology.teacherIds.map(teacherLastNames));
			expect(archeologyteachers).to.include('Jackson');

			const class12 = await findClass(['12', '/3']);
			expect(class12.teacherIds.length).to.equal(1);
			const class12teachers = await Promise.all(class12.teacherIds.map(teacherLastNames));
			expect(class12teachers).to.include('Hammond');
		});
	});

	describe('Scenario 5 - Importing teachers and sending invitation emails', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const TEACHER_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de'];
		const CLASSES = [
			[undefined, 'NSA'],
			[undefined, 'CIA'],
			[undefined, 'BuyMore'],
		];

		before(async () => {
			await Promise.all(CLASSES.map((klass) => createClass([...klass, SCHOOL_ID])));

			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'teacher',
				sendEmails: 'true',
			};
			scenarioData = {
				data:
					'firstName,lastName,email,class\n' +
					`Chuck,Bartowski,${TEACHER_EMAILS[0]},BuyMore\n` +
					`Sarah,Walker,${TEACHER_EMAILS[1]},NSA\n` +
					`Colonel John,Casey,${TEACHER_EMAILS[2]},CIA\n`,
			};
		});

		after(async () => {
			await Promise.all(TEACHER_EMAILS.map((email) => deleteUser(email)));
			await Promise.all(CLASSES.map((klass) => deleteClass(klass)));
			await testObjects.cleanup();
			app.use('/mails', new MailService());
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import five teachers into three existing classes', async () => {
			const emails = [];
			app.use(
				'/mails',
				new MockEmailService((email) => {
					emails.push(email);
				})
			);

			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(true);
			expect(stats.users.successful).to.equal(3);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(3);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(3);
			expect(stats.classes.failed).to.equal(0);

			expect(emails.length).to.equal(3);
			expect(emails[0].subject).to.equal(`Einladung für die Nutzung der ${SC_TITLE}!`);
			expect(emails[0].content.text).to.include('Hallo Chuck Bartowski!');

			await Promise.all(
				TEACHER_EMAILS.map(async (email) => {
					const [user] = await userModel.find({ email });
					const [role] = await roleModel.find({ _id: user.roles[0] });
					expect(role.name).to.equal('teacher');
				})
			);
		});
	});

	describe('Scenario 6 - Éncöding', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const EXISTING_CLASSES = [
			['1', 'a'],
			['2', 'b'],
		];
		const STUDENT_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de'];

		before(async () => {
			await Promise.all(EXISTING_CLASSES.map((klass) => createClass([...klass, SCHOOL_ID])));

			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'student',
			};
			scenarioData = {
				data:
					'firstName,lastName,email,class\n' +
					`工藤,新,${STUDENT_EMAILS[0]},1a\n` +
					`毛利,蘭,${STUDENT_EMAILS[1]},1a\n` +
					`毛利,小五郎,${STUDENT_EMAILS[2]},2b\n`,
			};
		});

		after(async () => {
			await Promise.all(STUDENT_EMAILS.map((email) => deleteUser(email)));
			await Promise.all(EXISTING_CLASSES.map((klass) => deleteClass(klass)));
			await testObjects.cleanup();
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import three exchange students into existing classes', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(true);
			expect(stats.users.successful).to.equal(3);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(3);
			expect(stats.classes.created).to.equal(0);
			expect(stats.classes.updated).to.equal(3);
			expect(stats.classes.failed).to.equal(0);

			await Promise.all(
				STUDENT_EMAILS.map(async (email) => {
					const [user] = await userModel.find({ email });
					const [role] = await roleModel.find({ _id: user.roles[0] });
					expect(role.name).to.equal('student');
				})
			);

			const studentLastNames = async (student) => {
				const [user] = await app.service('users').find({
					query: {
						_id: student,
					},
					paginate: false,
				});
				return user.lastName;
			};

			const class1a = await findClass(['1', 'a']);
			expect(class1a.userIds.length).to.equal(2);
			const class1astudents = await Promise.all(class1a.userIds.map(studentLastNames));
			expect(class1astudents).to.include('新');
			expect(class1astudents).to.include('蘭');

			const class2b = await findClass(['2', 'b']);
			expect(class2b.userIds.length).to.equal(1);
			const class2bstudents = await Promise.all(class2b.userIds.map(studentLastNames));
			expect(class2bstudents).to.include('小五郎');
		});
	});

	describe('Scenario 7 - Duplicate Email Errors', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const TEACHER_EMAILS = ['a@b.de'];

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'teacher',
			};
			scenarioData = {
				data:
					'firstName,lastName,email\n' +
					`Peter,Pan,${TEACHER_EMAILS[0]}\n` +
					`Peter,Lustig,${TEACHER_EMAILS[0]}\n` +
					`Test,Testington,${TEACHER_EMAILS[0]}\n`,
			};
		});

		after(async () => {
			await testObjects.cleanup();
			await deleteUser(TEACHER_EMAILS[0]);
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import one user and report two failures', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(false);
			expect(stats.users.successful).to.equal(1);
			expect(stats.users.created).to.equal(1);
			expect(stats.users.updated).to.equal(0);
			expect(stats.users.failed).to.equal(2);

			const users = await userModel.find({
				email: { $in: TEACHER_EMAILS },
			});
			expect(users.length).to.equal(1);
			const [role] = await roleModel.find({
				_id: users[0].roles[0],
			});
			expect(role.name).to.equal('teacher');

			expect(stats.errors).to.deep.include({
				type: 'user',
				entity: `Peter,Lustig,${TEACHER_EMAILS[0]}`,
				message:
					`Mehrfachnutzung der E-Mail-Adresse "${TEACHER_EMAILS[0]}". ` +
					'Nur der erste Eintrag wurde importiert, dieser ignoriert.',
			});
			expect(stats.errors).to.deep.include({
				type: 'user',
				entity: `Test,Testington,${TEACHER_EMAILS[0]}`,
				message:
					`Mehrfachnutzung der E-Mail-Adresse "${TEACHER_EMAILS[0]}". ` +
					'Nur der erste Eintrag wurde importiert, dieser ignoriert.',
			});
		});
	});

	describe('Scenario 8 - Email errors', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const TEACHER_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de'];
		const CLASSES = [
			[undefined, 'NSA'],
			[undefined, 'CIA'],
			[undefined, 'BuyMore'],
		];

		before(async () => {
			await Promise.all(CLASSES.map((klass) => createClass([...klass, SCHOOL_ID])));

			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'teacher',
				sendEmails: 'true',
			};
			scenarioData = {
				data:
					'firstName,lastName,email,class\n' +
					`Chuck,Bartowski,${TEACHER_EMAILS[0]},BuyMore\n` +
					`Sarah,Walker,${TEACHER_EMAILS[1]},NSA\n` +
					`Colonel John,Casey,${TEACHER_EMAILS[2]},CIA\n`,
			};
		});

		after(async () => {
			await Promise.all(TEACHER_EMAILS.map((email) => deleteUser(email)));
			await Promise.all(CLASSES.map((klass) => deleteClass(klass)));
			await testObjects.cleanup();
			app.use('/mails', new MailService());
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should not be able to send emails', async () => {
			app.use(
				'/mails',
				new MockEmailService(() => {
					throw new Error('Some Email error...');
				})
			);

			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(false);
			expect(stats.users.successful).to.equal(3);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(3);

			expect(stats.errors.filter((e) => e.type === 'invitation').length).to.equal(3);
		});
	});

	describe('Scenario 9 - No Emails should be sent for failing users', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const TEACHER_EMAILS = ['a@b.de'];

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'teacher',
				sendEmails: 'true',
			};
			scenarioData = {
				data:
					'firstName,lastName,email\n' +
					`Peter,Pan,${TEACHER_EMAILS[0]}\n` +
					`Peter,Lustig,${TEACHER_EMAILS[0]}\n` +
					`Test,Testington,${TEACHER_EMAILS[0]}\n`,
			};
		});

		after(async () => {
			await testObjects.cleanup();
			await deleteUser(TEACHER_EMAILS[0]);
			app.use('/mails', new MailService());
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import one user report two failures', async () => {
			const emails = [];
			app.use(
				'/mails',
				new MockEmailService((email) => {
					emails.push(email);
				})
			);

			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(false);
			expect(stats.users.successful).to.equal(1);
			expect(stats.users.created).to.equal(1);
			expect(stats.users.updated).to.equal(0);
			expect(stats.users.failed).to.equal(2);

			expect(stats.errors).to.deep.include({
				type: 'user',
				entity: `Peter,Lustig,${TEACHER_EMAILS[0]}`,
				message:
					`Mehrfachnutzung der E-Mail-Adresse "${TEACHER_EMAILS[0]}". ` +
					'Nur der erste Eintrag wurde importiert, dieser ignoriert.',
			});
			expect(stats.errors).to.deep.include({
				type: 'user',
				entity: `Test,Testington,${TEACHER_EMAILS[0]}`,
				message:
					`Mehrfachnutzung der E-Mail-Adresse "${TEACHER_EMAILS[0]}". ` +
					'Nur der erste Eintrag wurde importiert, dieser ignoriert.',
			});

			// only one email should ever be sent, as the second and third user are never
			// created in the first place
			expect(emails.length).to.equal(1);
			expect(stats.errors.filter((e) => e.type === 'invitation').length).to.equal(0);
		});
	});

	describe('Scenario 10 - Reject invalid email format', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const SCENARIO_EMAIL = 'peterpan.de';

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'student',
			};
			scenarioData = {
				data: `firstName,lastName,email\nPeter,Pan,${SCENARIO_EMAIL}`,
			};
		});

		after(async () => {
			await testObjects.cleanup();
			await deleteUser(SCENARIO_EMAIL);
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import a single student without a class', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(false);
			expect(stats.users.successful).to.equal(0);
			expect(stats.users.failed).to.equal(1);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(0);
			expect(stats.classes.failed).to.equal(0);

			const users = await userModel.find({ email: SCENARIO_EMAIL });
			expect(users.length).to.equal(0);
		});
	});

	describe('Scenario 11 - Importing the same data twice', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const TEACHER_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de', 'd@e.de', 'e@f.de'];

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'teacher',
			};
			scenarioData = {
				data:
					'firstName,lastName,email,class\n' +
					`Dr. Temperance,Brennan,${TEACHER_EMAILS[0]},Jeffersonian Institute\n` +
					`Seeley,Booth,${TEACHER_EMAILS[1]},FBI\n` +
					`Lance,Sweets,${TEACHER_EMAILS[2]},FBI\n` +
					`Camille,Saroyan,${TEACHER_EMAILS[3]},Jeffersonian Institute\n` +
					`Zack,Addy,${TEACHER_EMAILS[4]},\n`,
			};
		});

		after(async () => {
			await Promise.all(TEACHER_EMAILS.map((email) => deleteUser(email)));
			await deleteClass([undefined, 'Jeffersonian Institute']);
			await deleteClass([undefined, 'FBI']);
			await testObjects.cleanup();
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import five teachers into three existing classes', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(true);
			expect(stats.users.successful).to.equal(5);
			expect(stats.users.created).to.equal(5);
			expect(stats.users.updated).to.equal(0);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(4);
			expect(stats.classes.created).to.equal(2);
			expect(stats.classes.updated).to.equal(2);
			expect(stats.classes.failed).to.equal(0);

			await Promise.all(
				TEACHER_EMAILS.map(async (email) => {
					const [user] = await userModel.find({ email });
					const [role] = await roleModel.find({ _id: user.roles[0] });
					expect(role.name).to.equal('teacher');
				})
			);

			// Now import the same data again:
			const [stats2] = await app.service('sync').create(scenarioData, scenarioParams);

			// all 5 users are updated (with the same data, so nothing changes)
			expect(stats2.success).to.equal(true);
			expect(stats2.users.successful).to.equal(5);
			expect(stats2.users.created).to.equal(0);
			expect(stats2.users.updated).to.equal(0);
			expect(stats2.users.failed).to.equal(0);
			expect(stats2.invitations.successful).to.equal(0);
			expect(stats2.invitations.failed).to.equal(0);
			expect(stats2.classes.successful).to.equal(4);
			expect(stats2.classes.created).to.equal(0);
			expect(stats2.classes.updated).to.equal(4);
			expect(stats2.classes.failed).to.equal(0);

			const teacherLastNames = async (teacher) => {
				const [user] = await app.service('users').find({
					query: { _id: teacher },
					paginate: false,
				});
				return user.lastName;
			};

			const fbi = await findClass([undefined, 'FBI']);
			expect(fbi.teacherIds.length).to.equal(2);
			const fbiteachers = await Promise.all(fbi.teacherIds.map(teacherLastNames));
			expect(fbiteachers).to.include('Booth');
			expect(fbiteachers).to.include('Sweets');

			const ji = await findClass([undefined, 'Jeffersonian Institute']);
			expect(ji.teacherIds.length).to.equal(2);
			const jiteachers = await Promise.all(ji.teacherIds.map(teacherLastNames));
			expect(jiteachers).to.include('Brennan');
			expect(jiteachers).to.include('Saroyan');
		});
	});

	describe('Scenario 12 - Importing again updates names and classes', () => {
		let scenarioParams;
		let scenarioData1;
		let scenarioData2;

		const SCHOOL_ID = testObjects.options.schoolId;
		const TEACHER_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de', 'd@e.de'];

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'teacher',
			};
			scenarioData1 = {
				data:
					'firstName,lastName,email,class\n' +
					`Richard,Winters,${TEACHER_EMAILS[0]},Easy Company\n` +
					`Lewis,Nixon,${TEACHER_EMAILS[1]},Easy Company\n` +
					`Carwood,Lipton,${TEACHER_EMAILS[2]},Easy Company\n`,
			};
			scenarioData2 = {
				data:
					'firstName,lastName,email,class\n' +
					`Richard,Winters,${TEACHER_EMAILS[0]},Easy Company\n` +
					`LeW1s,Nixx0n,${TEACHER_EMAILS[1]},Best Company\n` +
					`Donald,Malarkey,${TEACHER_EMAILS[3]},Easy Company\n`,
			};
		});

		after(async () => {
			await Promise.all(TEACHER_EMAILS.map((email) => deleteUser(email)));
			await deleteClass([undefined, 'Easy Company']);
			await deleteClass([undefined, 'Best Company']);
			await testObjects.cleanup();
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData1)).to.not.equal(false);
			expect(CSVSyncer.params(scenarioParams, scenarioData2)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			let params = CSVSyncer.params(scenarioParams, scenarioData1);
			let instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);

			params = CSVSyncer.params(scenarioParams, scenarioData2);
			instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import five teachers into three existing classes', async () => {
			const [stats] = await app.service('sync').create(scenarioData1, scenarioParams);

			expect(stats.success).to.equal(true);
			expect(stats.users.successful).to.equal(3);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(3);
			expect(stats.classes.created).to.equal(1);
			expect(stats.classes.updated).to.equal(2);
			expect(stats.classes.failed).to.equal(0);

			// Now import the second data set:
			const [stats2] = await app.service('sync').create(scenarioData2, scenarioParams);

			// two users are updated and one is added
			expect(stats2.success).to.equal(true);
			expect(stats2.users.successful).to.equal(3);
			expect(stats2.users.failed).to.equal(0);
			expect(stats2.invitations.successful).to.equal(0);
			expect(stats2.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(3);
			expect(stats.classes.created).to.equal(1);
			expect(stats.classes.updated).to.equal(2);
			expect(stats2.classes.failed).to.equal(0);

			const teacherLastNames = async (teacher) => {
				const [user] = await app.service('users').find({
					query: { _id: teacher },
					paginate: false,
				});
				return user.lastName;
			};

			const ji = await findClass([undefined, 'Best Company']);
			expect(ji).to.not.equal(undefined);
			expect(ji.teacherIds.length).to.equal(1); // Nixon was added to Best Company.
			// Also note that he is still part of Easy Company from the previous import (see below).

			const ec = await findClass([undefined, 'Easy Company']);
			expect(ec.teacherIds.length).to.equal(4);
			const ecTeachers = await Promise.all(ec.teacherIds.map(teacherLastNames));
			expect(ecTeachers).to.include('Winters');
			expect(ecTeachers).to.not.include('Nixx0n'); // lastName was not updated
			expect(ecTeachers).to.include('Lipton');
			expect(ecTeachers).to.include('Malarkey');
		});
	});

	describe('Scenario 13 - Importing classes optionally assigns them to a school year', () => {
		let scenario1;
		let scenario2;
		const STUDENT_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de', 'd@e.de'];

		before(async function before() {
			this.timeout(5000);

			const school1 = await createSchool({
				currentYear: await createYear(),
			});
			const school2 = await createSchool({
				currentYear: await createYear(),
			});

			const user1 = await createUser({
				roles: 'administrator',
				schoolId: school1._id,
			});
			const user2 = await createUser({
				roles: 'administrator',
				schoolId: school2._id,
			});

			scenario1 = {
				school: school1,
				params: {
					...(await generateRequestParamsFromUser(user1)),
					query: {
						target: 'csv',
						school: school1._id,
						role: 'student',
					},
				},
				data: {
					data:
						'firstName,lastName,email,class\n' +
						`Dr. John W.,Thackery,${STUDENT_EMAILS[0]},1a\n` +
						`Dr. Algernon C.,Edwards,${STUDENT_EMAILS[1]},1b\n`,
				},
			};
			scenario2 = {
				school: school2,
				params: {
					...(await generateRequestParamsFromUser(user2)),
					query: {
						target: 'csv',
						school: school2._id,
						role: 'student',
					},
				},
				data: {
					data:
						'firstName,lastName,email,class\n' +
						`Herman,Barrow,${STUDENT_EMAILS[2]},2a\n` +
						`Cornelia,Robertson,${STUDENT_EMAILS[3]},2b\n`,
				},
			};
		});

		afterEach(async () => {
			await Promise.all(STUDENT_EMAILS.map((email) => deleteUser(email)));
			await Promise.all(
				[
					['1', 'a'],
					['1', 'b'],
					['2', 'a'],
					['2', 'b'],
				].map((klass) => deleteClass(klass))
			);
		});

		after(testObjects.cleanup);

		it('should create classes based on the current school year by default', async () => {
			expect(scenario1.school.currentYear._id.toString()).to.not.equal(scenario2.school.currentYear._id.toString());

			// scenario 1
			const [stats] = await app.service('sync').create(scenario1.data, scenario1.params);

			expect(stats.success).to.equal(true);
			expect(stats.users.successful).to.equal(2);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(2);
			expect(stats.classes.created).to.equal(2);
			expect(stats.classes.failed).to.equal(0);

			const class1a = await findClass(['1', 'a']);
			expect(class1a.year.toString()).to.equal(scenario1.school.currentYear._id.toString());

			const class1b = await findClass(['1', 'b']);
			expect(class1b.year.toString()).to.equal(scenario1.school.currentYear._id.toString());

			// scenario 2
			const [stats2] = await app.service('sync').create(scenario2.data, scenario2.params);

			expect(stats2.success).to.equal(true);
			expect(stats2.users.successful).to.equal(2);
			expect(stats2.users.failed).to.equal(0);
			expect(stats2.invitations.successful).to.equal(0);
			expect(stats2.invitations.failed).to.equal(0);
			expect(stats2.classes.successful).to.equal(2);
			expect(stats2.classes.created).to.equal(2);
			expect(stats2.classes.failed).to.equal(0);

			const class2a = await findClass(['2', 'a']);
			expect(class2a.year.toString()).to.equal(scenario2.school.currentYear._id.toString());

			const class2b = await findClass(['2', 'b']);
			expect(class2b.year.toString()).to.equal(scenario2.school.currentYear._id.toString());
		});

		it('should assign a created class to a school year if specified in the request', async () => {
			// modified scenario 1
			const year = await createYear();
			const [stats] = await app.service('sync').create(scenario1.data, {
				...scenario1.params,
				query: {
					...scenario1.params.query,
					schoolYear: year._id,
				},
			});

			expect(stats.success).to.equal(true);
			expect(stats.classes.successful).to.equal(2);
			expect(stats.classes.created).to.equal(2);
			expect(stats.classes.failed).to.equal(0);

			const class1a = await findClass(['1', 'a']);
			expect(class1a.year.toString()).not.to.equal(scenario1.school.currentYear._id.toString());
			expect(class1a.year.toString()).to.equal(year._id.toString());

			const class1b = await findClass(['1', 'b']);
			expect(class1b.year.toString()).not.to.equal(scenario1.school.currentYear._id.toString());
			expect(class1b.year.toString()).to.equal(year._id.toString());
		});

		it('should create new classes if classes of the same name exist only for another year', async () => {
			const oldYear = await createYear(); // oldYear is different from school.currentYear
			await createClass(['1', 'a', scenario1.school._id], {
				year: oldYear._id,
			});

			const [stats] = await app.service('sync').create(scenario1.data, scenario1.params);

			expect(stats.success).to.equal(true);
			expect(stats.users.successful).to.equal(2);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(2);
			expect(stats.classes.created).to.equal(2);
			expect(stats.classes.failed).to.equal(0);

			const classes1a = await findClasses(['1', 'a']);
			expect(classes1a.length).to.equal(2);
			expect(classes1a.some((c) => c.year.toString() === oldYear._id.toString())).to.equal(true);
			expect(classes1a.some((c) => c.year.toString() === scenario1.school.currentYear._id.toString())).to.equal(true);

			// there is no existing class 1b:
			const class1b = await findClass(['1', 'b']);
			expect(class1b.year.toString()).to.equal(scenario1.school.currentYear._id.toString());
		});
	});

	describe('Scenario 14 - Attribute aliases', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const TEACHER_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de'];

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'teacher',
			};
			scenarioData = {
				data:
					'affix,first,middle,last,eMail\n' +
					`Dr.,Peter,F.,Pan,${TEACHER_EMAILS[0]}\n` +
					`Mr.,Peter,,Lustig,${TEACHER_EMAILS[1]}\n` +
					`HM,Test,T.,Testington,${TEACHER_EMAILS[2]}\n`,
			};
		});

		after(async () => {
			await testObjects.cleanup();
			await deleteUser(TEACHER_EMAILS[0]);
			await deleteUser(TEACHER_EMAILS[1]);
			await deleteUser(TEACHER_EMAILS[2]);
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import three teachers without a class', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(true);
			expect(stats.users.successful).to.equal(3);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(0);
			expect(stats.classes.failed).to.equal(0);

			const users = await userModel.find({
				email: { $in: TEACHER_EMAILS },
			});
			expect(users.length).to.equal(3);
			expect(users.some((u) => u.fullName === 'Dr. Peter F. Pan')).to.equal(true);
			expect(users.some((u) => u.fullName === 'Mr. Peter Lustig')).to.equal(true);
			expect(users.some((u) => u.fullName === 'HM Test T. Testington')).to.equal(true);
		});
	});

	describe('Scenario 15 - Parsing errors', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const TEACHER_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de'];

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'teacher',
				sendEmails: 'false',
			};
			scenarioData = {
				data:
					'firstName,lastName,email\n' +
					`Chester,Bennington,${TEACHER_EMAILS[0]}\n` +
					`Mike,Shinoda,${TEACHER_EMAILS[1]}\n` +
					`Dave "Phoenix,Pharell${TEACHER_EMAILS[2]}\n`, // should produce a parsing error
			};
		});

		after(async () => {
			await Promise.all(TEACHER_EMAILS.map((email) => deleteUser(email)));
			await testObjects.cleanup();
		});

		it('should detect and skip Syntax errors', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(false);
			expect(stats.users.successful).to.equal(2);
			expect(stats.users.failed).to.equal(1);

			expect(stats.errors.filter((e) => e.type === 'file').length).to.equal(1);
		});
	});

	describe('Scenario 16 - Importing students with birthdays', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const PEOPLE = [
			{
				email: 'amail@bdaydomain.de',
				birthday: '17.08.1988',
				parsed: new Date('08/17/1988'),
				firstName: 'Peter',
				lastName: 'Griffin',
			},
			{
				email: 'bmail@bdaydomain.de',
				birthday: '01/04/1990',
				parsed: new Date('04/01/1990'),
				firstName: 'Adam',
				lastName: 'West',
			},
			{
				email: 'cmail@bdaydomain.de',
				birthday: '12/13/2002', // will fail
				parsed: undefined,
				firstName: 'Cleveland',
				lastName: 'Brown',
			},
		];

		before(async () => {
			// this user does the csv importing
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'student',
			};
			scenarioData = {
				data: `firstName,lastName,email,birthday\n${PEOPLE.map(
					(p) => `${p.firstName},${p.lastName},${p.email},${p.birthday}`
				).join('\n')}`,
			};
		});

		after(async () => {
			await Promise.all(PEOPLE.map((person) => deleteUser(person.email)));
			await testObjects.cleanup();
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should have new users with new birthday values', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(false);
			expect(stats.users.successful).to.equal(3);
			expect(stats.users.failed).to.equal(0);
			expect(stats.errors.length).to.equal(1); // birthday validation

			const users = await userModel.find({
				email: { $in: PEOPLE.map((p) => p.email) },
			});

			PEOPLE.forEach((person) => {
				const user = users.find((u) => u.firstName === person.firstName && u.lastName === person.lastName);
				expect(user).to.be.ok;
				expect(user.birthday).to.deep.equal(person.parsed);
			});
		});
	});

	describe('Scenario 17 - Importing a student having whitespaces in the columnnames', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const SCENARIO_EMAIL = 'peter@pan.de';

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'student',
			};
			scenarioData = {
				data: ` firstName,lastName , email \nPeter,Pan,${SCENARIO_EMAIL}`,
			};
		});

		after(async () => {
			await deleteUser(SCENARIO_EMAIL);
		});

		after(testObjects.cleanup);

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import a single student without a class', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(true);
			expect(stats.users.successful).to.equal(1);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(0);
			expect(stats.classes.failed).to.equal(0);

			const users = await userModel.find({
				email: SCENARIO_EMAIL,
			});
			expect(users.length).to.equal(1);
			const [role] = await roleModel.find({
				_id: users[0].roles[0],
			});
			expect(role.name).to.equal('student');
		});
	});

	describe('Scenario 18 - Importing teachers having whitespaces in the columnnames', () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;
		const TEACHER_EMAILS = ['a@b.de', 'b@c.de', 'c@d.de'];

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'teacher',
			};
			scenarioData = {
				data:
					' firstName,lastName , email\n' +
					`Peter,Pan,${TEACHER_EMAILS[0]}\n` +
					`Peter,Lustig,${TEACHER_EMAILS[1]}\n` +
					`Test,Testington,${TEACHER_EMAILS[2]}\n`,
			};
		});

		after(async () => {
			await testObjects.cleanup();
			await deleteUser(TEACHER_EMAILS[0]);
			await deleteUser(TEACHER_EMAILS[1]);
			await deleteUser(TEACHER_EMAILS[2]);
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should import three teachers without a class', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(true);
			expect(stats.users.successful).to.equal(3);
			expect(stats.users.failed).to.equal(0);
			expect(stats.invitations.successful).to.equal(0);
			expect(stats.invitations.failed).to.equal(0);
			expect(stats.classes.successful).to.equal(0);
			expect(stats.classes.failed).to.equal(0);

			const users = await userModel.find({
				email: { $in: TEACHER_EMAILS },
			});
			expect(users.length).to.equal(3);
			const [role] = await roleModel.find({
				_id: users[0].roles[0],
			});
			expect(role.name).to.equal('teacher');
		});
	});

	describe("Scenario 19 - don't allow updating roles", () => {
		let scenarioParams;
		let scenarioData;

		const SCHOOL_ID = testObjects.options.schoolId;

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});
			const student = await createUser({
				roles: 'student',
				schoolId: SCHOOL_ID,
			});
			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'teacher',
			};
			scenarioData = {
				data: `firstName,lastName,email\n Peter,Pan,${user.email}\n Test,Testington,${student.email}\n`,
			};
		});

		after(async () => {
			await testObjects.cleanup();
		});

		it('should not change any data and report three errors', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(false);
			expect(stats.users.successful).to.equal(0);
			expect(stats.users.created).to.equal(0);
			expect(stats.users.updated).to.equal(0);
			expect(stats.users.failed).to.equal(2);
			expect(stats.errors.length).to.equal(2);
			expect(stats.errors[0].message).to.equal(
				'Fehler beim Generieren des Hashes. BadRequest: User already has an account.'
			);
			expect(stats.errors[1].message).to.equal(
				'Es existiert bereits ein Nutzer mit dieser E-Mail-Adresse, jedoch mit einer anderen Rolle.'
			);
		});
	});

	describe('Scenario 20 - User email already in use on other school', () => {
		let scenarioParams;
		let scenarioData;
		let existingUser;
		let school;

		const SCHOOL_ID = testObjects.options.schoolId;
		const EMAIL = `${testObjects.randomGen()}a@b.de`;

		before(async () => {
			const user = await createUser({
				roles: 'administrator',
				schoolId: SCHOOL_ID,
			});

			school = await testObjects.createTestSchool();

			existingUser = await createUser({
				email: EMAIL,
				schoolId: school._id,
				roles: 'teacher',
			});

			scenarioParams = await generateRequestParamsFromUser(user);
			scenarioParams.query = {
				target: 'csv',
				school: SCHOOL_ID,
				role: 'teacher',
			};
			scenarioData = {
				data: `firstName,lastName,email\nPeter,Pan,${EMAIL}\n`,
			};
		});

		after(async () => {
			await testObjects.cleanup();
		});

		it('Should create a user with tested email.', () => {
			expect(existingUser.email).to.equal(EMAIL);
		});

		it('should be accepted for execution', () => {
			expect(CSVSyncer.params(scenarioParams, scenarioData)).to.not.equal(false);
		});

		it('should initialize without errors', () => {
			const params = CSVSyncer.params(scenarioParams, scenarioData);
			const instance = new CSVSyncer(app, {}, ...params);
			expect(instance).to.not.equal(undefined);
		});

		it('should report one failures', async () => {
			const [stats] = await app.service('sync').create(scenarioData, scenarioParams);

			expect(stats.success).to.equal(false);
			expect(stats.users.successful).to.equal(0);
			expect(stats.users.created).to.equal(0);
			expect(stats.users.updated).to.equal(0);
			expect(stats.users.failed).to.equal(1);
			expect(stats.errors.length).to.equal(1);

			const users = await userModel.find({
				email: { $in: EMAIL },
			});

			expect(users.length, 'should no doublications exist').to.equal(1);
			expect(users[0].schoolId.toString(), 'should no override existing user schoolId').to.equal(school._id.toString());

			expect(stats.errors[0]).to.eql({
				type: 'user',
				entity: `Peter,Pan,${EMAIL}`,
				message: 'User is not on your school.',
			});
		});
	});
});
