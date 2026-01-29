import { createMock } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { lessonFactory } from '@modules/lesson/testing';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
// config must be set outside before the server module is importat, otherwise the configuration is already set
const configBefore = Configuration.toObject({ plainSecrets: true });
Configuration.set('INCOMING_REQUEST_TIMEOUT_COPY_API', 1);
// eslint-disable-next-line import/first
import { ServerTestModule } from '@modules/server';
import { LEARNROOM_CONFIG_TOKEN, LearnroomConfig } from '../../learnroom.config';

// This needs to be in a separate test file because of the above configuration.
// When we find a way to mock the config, it should be moved alongside the other API tests.
describe('Course Rooms copy (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let apiClient: TestApiClient;
	let config: LearnroomConfig;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(FilesStorageClientAdapterService)
			.useValue(createMock<FilesStorageClientAdapterService>())
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);

		apiClient = new TestApiClient(app, '/course-rooms');
		config = app.get<LearnroomConfig>(LEARNROOM_CONFIG_TOKEN);
		config.featureCopyServiceEnabled = true;
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
		Configuration.reset(configBefore);
	});

	describe('when copying course', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ name: 'course #1', teachers: [teacherUser] });

			await em.persist([course, teacherAccount, teacherUser]).flush();
			em.clear();

			const loggedInClient = await apiClient.login(teacherAccount);

			return { loggedInClient, course };
		};

		it('should respond with 408 on timeout', async () => {
			const { loggedInClient, course } = await setup();

			const response = await loggedInClient.post(`/${course.id}/copy`);

			expect(response.status).toEqual(408);
		});
	});

	describe('when copying lesson', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ name: 'course #1', teachers: [teacherUser] });
			const lesson = lessonFactory.build({ name: 'lesson #1', course });

			await em.persist([course, lesson, teacherAccount, teacherUser]).flush();
			em.clear();

			const loggedInClient = await apiClient.login(teacherAccount);

			return { loggedInClient, lesson };
		};

		it('should respond with 408 on timeout', async () => {
			const { loggedInClient, lesson } = await setup();

			const response = await loggedInClient.post(`/lessons/${lesson.id}/copy`);

			expect(response.status).toEqual(408);
		});
	});
});
