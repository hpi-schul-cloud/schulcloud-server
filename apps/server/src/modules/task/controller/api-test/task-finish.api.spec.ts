import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import {
	cleanupCollections,
	courseFactory,
	taskFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';

const createStudent = () => {
	const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({}, [
		Permission.TASK_DASHBOARD_VIEW_V3,
		Permission.HOMEWORK_VIEW,
	]);
	return { account: studentAccount, user: studentUser };
};

const createTeacher = () => {
	const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [
		Permission.TASK_DASHBOARD_TEACHER_VIEW_V3,
	]);
	return { account: teacherAccount, user: teacherUser };
};

describe('Task Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'tasks');
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('[PATCH] :taskId/finish', () => {
		const setup = async () => {
			const teacher = createTeacher();
			const student = createStudent();
			const course = courseFactory.build({
				teachers: [teacher.user],
				students: [student.user],
			});
			const task = taskFactory.build({ course, finished: [] });

			await em.persistAndFlush([teacher.user, teacher.account, student.user, student.account, task]);
			em.clear();

			const studentClient = await testApiClient.login(student.account);

			return { studentClient, teacher, student, course, task };
		};

		describe('when logged in as a student', () => {
			it('should return status 200 for valid task', async () => {
				const { studentClient, task } = await setup();

				const response = await studentClient.patch(`${task.id}/finish`);

				expect(response.status).toEqual(200);
			});
		});
	});
});
