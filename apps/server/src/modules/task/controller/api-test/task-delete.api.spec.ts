import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cleanupCollections,
	courseFactory,
	taskFactory,
} from '@shared/testing';

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
		const setup = async () => {
			const teacher = createTeacher();
			const student = createStudent();
			const course = courseFactory.build({
				teachers: [teacher.user],
				students: [student.user],
			});
			const task = taskFactory.isPublished().build({ course });

			await em.persistAndFlush([teacher.user, teacher.account, student.user, student.account, task]);
			em.clear();

			const teacherClient = await testApiClient.login(teacher.account);

			return { teacherClient, teacher, student, course, task };
		};

		describe('when logged in as a teacher', () => {
			it('should return status 200 for valid task', async () => {
				const { teacherClient, task } = await setup();

				const response = await teacherClient.delete(`${task.id}`);

				expect(response.status).toEqual(200);
			});
		});
	});
});
