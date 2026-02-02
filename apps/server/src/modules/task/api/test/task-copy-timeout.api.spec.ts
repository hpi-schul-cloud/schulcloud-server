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
import { TASK_PUBLIC_API_CONFIG_TOKEN, TaskPublicApiConfig } from '../../task.config';
import { taskFactory } from '../../testing';

// eslint-disable-next-line import/first
import { MERGED_TIMEOUT_CONFIG_TOKEN } from '@core/interceptor';
import { ServerTestModule } from '@modules/server/server.app.module';
import { TaskTimeoutConfig } from '../../timeout.config';

describe('Task copy (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let configBefore: IConfig;
	let apiClient: TestApiClient;
	let config: TaskPublicApiConfig;
	let timeoutConfig: TaskTimeoutConfig;

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
		config = app.get<TaskPublicApiConfig>(TASK_PUBLIC_API_CONFIG_TOKEN);
		config.featureCopyServiceEnabled = true;
		timeoutConfig = app.get(MERGED_TIMEOUT_CONFIG_TOKEN);
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

		timeoutConfig.incomingRequestTimeout = 1;

		return { loggedInClient, task };
	};

	it('should respond with 408 on timeout', async () => {
		const { loggedInClient, task } = await setup();

		const response = await loggedInClient.post(`${task.id}/copy`);

		expect(response.status).toEqual(408);
	});
});
