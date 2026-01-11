import { createMock } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { taskFactory } from '../../testing';
// config must be set outside before the server module is imported, otherwise the configuration is already set
Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);
Configuration.set('INCOMING_REQUEST_TIMEOUT_COPY_API', 1);

// eslint-disable-next-line import/first
import { ServerTestModule } from '@modules/server/server.app.module';

// This needs to be in a separate test file because of the above configuration.
// When we find a way to mock the config, it should be moved alongside the other API tests.
describe('Task copy (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let configBefore: IConfig;
	let apiClient: TestApiClient;

	beforeAll(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true });
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(FilesStorageClientAdapterService)
			.useValue(createMock<FilesStorageClientAdapterService>())
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		apiClient = new TestApiClient(app, '/tasks');
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
		Configuration.reset(configBefore);
	});

	const setup = async () => {
		const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
		const course = courseEntityFactory.build({ name: 'course #1', teachers: [teacherUser] });
		const task = taskFactory.build({ name: 'task #1', course });

		await em.persist([task, course, teacherAccount, teacherUser]).flush();
		em.clear();

		const loggedInClient = await apiClient.login(teacherAccount);

		return { loggedInClient, task };
	};

	it('should respond with 408 on timeout', async () => {
		const { loggedInClient, task } = await setup();

		const response = await loggedInClient.post(`${task.id}/copy`);

		expect(response.status).toEqual(408);
	});
});
