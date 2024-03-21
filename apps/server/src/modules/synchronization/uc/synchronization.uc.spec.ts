import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { Logger } from '@src/core/logger';
import { UserService } from '@modules/user';
import { SanisResponse, SchulconnexRestClient, schulconnexResponseFactory } from '@src/infra/schulconnex-client';
import { SynchronizationService } from '../domain/service';
import { SynchronizationUc } from './synchronization.uc';

describe(SynchronizationUc.name, () => {
	let module: TestingModule;
	let uc: SynchronizationUc;
	let synchronizationService: DeepMocked<SynchronizationService>;
	let userService: DeepMocked<UserService>;
	let schulconnexRestClient: DeepMocked<SchulconnexRestClient>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SynchronizationUc,
				{
					provide: SynchronizationService,
					useValue: createMock<SynchronizationService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: SchulconnexRestClient,
					useValue: createMock<SchulconnexRestClient>(),
				},
			],
		}).compile();

		uc = module.get(SynchronizationUc);
		synchronizationService = module.get(SynchronizationService);
		schulconnexRestClient = module.get(SchulconnexRestClient);
		userService = module.get(UserService);
		await setupEntities();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('updateSystemUsersLastSyncedAt', () => {
		describe('when update users lastSynceAt for system', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const synchronizationId = new ObjectId().toHexString();

				synchronizationService.createSynchronization.mockResolvedValueOnce(synchronizationId);

				return {
					synchronizationId,
					systemId,
				};
			};

			it('should call the service.createSynchronization to create the synchronization', async () => {
				const { systemId } = setup();

				await uc.synchronization(systemId);

				expect(synchronizationService.createSynchronization).toHaveBeenCalled();
			});
		});
	});

	describe('findUsersToSynchronize', () => {
		describe('when fetching the data', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const externalUserData: SanisResponse = schulconnexResponseFactory.build();

				schulconnexRestClient.getPersonenInfo.mockResolvedValueOnce([externalUserData]);

				return {
					systemId,
					externalUserData,
				};
			};

			it('should call the schulconnex rest client', async () => {
				const { systemId } = setup();

				await uc.findUsersToSynchronize(systemId);

				expect(schulconnexRestClient.getPersonenInfo).toHaveBeenCalled();
			});

			it('should return users to synchronization', async () => {
				const { systemId, externalUserData } = setup();

				const result = await uc.findUsersToSynchronize(systemId);

				expect(result).toHaveLength(1);
				expect(result).toEqual([externalUserData.pid]);
			});
		});
	});
});
