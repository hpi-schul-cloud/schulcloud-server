import { AmqpConnection, AmqpConnectionManager, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { teamFactory } from '@modules/team/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';

const serverVariants = [
	{ name: 'regular server', module: ServerTestModule },
	{ name: 'admin API', module: AdminApiServerTestModule },
];

describe.each(serverVariants)('Teams Controller (API): $name', ({ module: serverModule }) => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let connectionFactorySpy: jest.SpyInstance;

	const countRooms = () => em.getConnection().getCollection('rooms').countDocuments({});

	beforeAll(async () => {
		connectionFactorySpy = jest.spyOn(RabbitMQModule, 'AmqpConnectionFactory');
		const moduleFixture = await Test.createTestingModule({ imports: [serverModule] })
			.overrideProvider(AmqpConnectionManager)
			.useValue(createMock<AmqpConnectionManager>({ getConnections: () => [] }))
			.overrideProvider(AmqpConnection)
			.useValue(
				createMock<AmqpConnection>({
					managedConnection: createMock<AmqpConnection['managedConnection']>(),
				})
			)
			.compile();
		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'teams');
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app?.close();
		connectionFactorySpy.mockRestore();
	});

	describe('bootstrap', () => {
		it('should not create real broker connections', () => {
			expect(connectionFactorySpy).not.toHaveBeenCalled();
		});
	});

	describe('POST /:teamId/create-room', () => {
		describe('when the caller is anonymous', () => {
			const setup = async () => {
				const team = teamFactory.buildWithId();
				const initialRoomCount = await countRooms();

				return { path: `${team.id}/create-room`, initialRoomCount, expectedStatus: HttpStatus.NOT_FOUND };
			};

			it('should return not found without creating a room', async () => {
				const { path, initialRoomCount, expectedStatus } = await setup();

				const response = await testApiClient.post(path);
				const finalRoomCount = await countRooms();

				expect(response.status).toBe(expectedStatus);
				expect(finalRoomCount).toBe(initialRoomCount);
			});
		});

		if (serverModule === ServerTestModule) {
			const roles: ('teacher' | 'administrator')[] = ['teacher', 'administrator'];
			describe.each(roles)('when the caller is an authenticated %s', (role) => {
				const setup = async () => {
					const { account, user } = UserAndAccountTestFactory.buildByRole(role);
					const team = teamFactory.buildWithId();
					await em.persist([account, user, user.school, ...user.roles.getItems()]).flush();
					const loggedInClient = await testApiClient.login(account);
					const initialRoomCount = await countRooms();

					return {
						loggedInClient,
						path: `${team.id}/create-room`,
						initialRoomCount,
						expectedStatus: HttpStatus.NOT_FOUND,
					};
				};

				it('should return not found without creating a room', async () => {
					const { loggedInClient, path, initialRoomCount, expectedStatus } = await setup();

					const response = await loggedInClient.post(path);
					const finalRoomCount = await countRooms();

					expect(response.status).toBe(expectedStatus);
					expect(finalRoomCount).toBe(initialRoomCount);
				});
			});
		}

		if (serverModule === AdminApiServerTestModule) {
			describe('when an API-key header is provided', () => {
				const setup = async () => {
					const team = teamFactory.buildWithId();
					const apiClient = new TestApiClient(app, 'teams', 'teams-removal-test-key', true);
					const initialRoomCount = await countRooms();

					return { apiClient, path: `${team.id}/create-room`, initialRoomCount, expectedStatus: HttpStatus.NOT_FOUND };
				};

				it('should return not found without creating a room', async () => {
					const { apiClient, path, initialRoomCount, expectedStatus } = await setup();

					const response = await apiClient.post(path);
					const finalRoomCount = await countRooms();

					expect(response.status).toBe(expectedStatus);
					expect(finalRoomCount).toBe(initialRoomCount);
				});
			});
		}
	});
});
