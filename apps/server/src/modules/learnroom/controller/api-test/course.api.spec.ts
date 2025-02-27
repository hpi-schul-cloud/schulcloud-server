import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { readFile } from 'node:fs/promises';

const createTeacher = () => {
	const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [
		Permission.COURSE_VIEW,
		Permission.COURSE_EDIT,
		Permission.COURSE_CREATE,
	]);
	return { account: teacherAccount, user: teacherUser };
};

describe('Course Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, 'courses');
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('[POST] /courses/import', () => {
		const setup = async () => {
			const teacher = createTeacher();
			const course = await readFile(
				'./apps/server/src/modules/common-cartridge/testing/assets/us_history_since_1877.imscc'
			);
			const courseFileName = 'us_history_since_1877.imscc';

			await em.persistAndFlush([teacher.account, teacher.user]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacher.account);

			return { loggedInClient, course, courseFileName };
		};

		it('should import course', async () => {
			const { loggedInClient, course, courseFileName } = await setup();

			const response = await loggedInClient.postWithAttachment('import', 'file', course, courseFileName);

			expect(response.statusCode).toEqual(201);
		}, 10000);
	});
});
