import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { taskFactory } from '../../testing';

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
		})
			.overrideProvider(FilesStorageClientAdapterService)
			.useValue(createMock<FilesStorageClientAdapterService>())
			.compile();

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

	describe('[DELETE] :taskId', () => {
		describe('when logged in as a teacher', () => {
			const setup = async () => {
				const teacher = createTeacher();
				const student = createStudent();
				const course = courseEntityFactory.build({
					teachers: [teacher.user],
					students: [student.user],
				});
				const task = taskFactory.isPublished().build({ course });

				await em.persist([teacher.user, teacher.account, student.user, student.account, task]).flush();
				em.clear();

				const teacherClient = await testApiClient.login(teacher.account);

				return { teacherClient, teacher, student, course, task };
			};

			it('should return status 200 for valid task', async () => {
				const { teacherClient, task } = await setup();

				const response = await teacherClient.delete(`${task.id}`);

				expect(response.status).toEqual(200);
			});
		});

		describe('when logged in as another teacher', () => {
			const setup = async () => {
				const teacher = createTeacher();
				const anotherTeacher = createTeacher();

				const task = taskFactory.isPublished().build();

				await em.persist([teacher.user, teacher.account, anotherTeacher.user, anotherTeacher.account, task]).flush();
				em.clear();

				const anotherTeacherClient = await testApiClient.login(anotherTeacher.account);

				return { anotherTeacherClient, anotherTeacher, task };
			};

			it('should return status 403 for valid task', async () => {
				const { anotherTeacherClient, task } = await setup();

				const response = await anotherTeacherClient.delete(`${task.id}`);

				expect(response.status).toEqual(403);
			});

			it('should not actually delete the task', async () => {
				const { anotherTeacherClient, task } = await setup();

				await anotherTeacherClient.delete(`${task.id}`);

				const taskAfterDelete = await em.findOneOrFail('Task', task.id);

				expect(taskAfterDelete).toBeDefined();
			});
		});
	});
});
