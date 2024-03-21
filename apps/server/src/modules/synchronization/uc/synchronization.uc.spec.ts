import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { Logger } from '@src/core/logger';
import { UserService } from '@modules/user';
import { SanisResponse, SchulconnexRestClient, schulconnexResponseFactory } from '@src/infra/schulconnex-client';
import { SynchronizationService } from '../domain/service';
import { SynchronizationUc } from './synchronization.uc';
import { SynchronizationErrorLoggableException } from '../domain/loggable-exception';
import { SynchronizationStatusModel } from '../domain/types';
import { synchronizationFactory } from '../domain/testing';
import { Synchronization } from '../domain';

describe(SynchronizationUc.name, () => {
	let module: TestingModule;
	let uc: SynchronizationUc;
	let userService: DeepMocked<UserService>;
	let synchronizationService: DeepMocked<SynchronizationService>;
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
		userService = module.get(UserService);
		schulconnexRestClient = module.get(SchulconnexRestClient);
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
				const usersToCheck = [new ObjectId().toHexString(), new ObjectId().toHexString()];
				const userSyncCount = 2;
				const status = SynchronizationStatusModel.SUCCESS;

				synchronizationService.createSynchronization.mockResolvedValueOnce(synchronizationId);
				jest.spyOn(uc, 'findUsersToSynchronize').mockResolvedValueOnce(usersToCheck);
				const spyUpdateLastSyncedAt = jest.spyOn(uc, 'updateLastSyncedAt');
				const spyUpdateSynchronization = jest.spyOn(uc, 'updateSynchronization');

				return {
					spyUpdateLastSyncedAt,
					spyUpdateSynchronization,
					status,
					synchronizationId,
					systemId,
					userSyncCount,
					usersToCheck,
				};
			};

			it('should call the synchronizationService.createSynchronization to create the synchronization', async () => {
				const { systemId } = setup();

				await uc.updateSystemUsersLastSyncedAt(systemId);

				expect(synchronizationService.createSynchronization).toHaveBeenCalled();
			});

			it('should call the uc.updateLastSyncedAt to update users for systemId', async () => {
				const { spyUpdateLastSyncedAt, systemId, usersToCheck } = setup();

				await uc.updateSystemUsersLastSyncedAt(systemId);

				expect(spyUpdateLastSyncedAt).toHaveBeenCalledWith(usersToCheck, systemId);
			});

			it('should call the uc.updateSynchronization to log detainls about synchronization of systemId', async () => {
				const { spyUpdateSynchronization, status, synchronizationId, systemId, userSyncCount } = setup();
				jest.spyOn(uc, 'updateLastSyncedAt').mockResolvedValueOnce(userSyncCount);

				await uc.updateSystemUsersLastSyncedAt(systemId);

				expect(spyUpdateSynchronization).toHaveBeenCalledWith(synchronizationId, status, userSyncCount);
			});
		});
	});

	describe('findUsersToSynchronize', () => {
		describe('when users was found', () => {
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

		describe('when users was not found', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();

				schulconnexRestClient.getPersonenInfo.mockResolvedValueOnce([]);

				const expectedError = new SynchronizationErrorLoggableException(`No users to check from systemId: ${systemId}`);

				return {
					expectedError,
					systemId,
				};
			};

			it('should throw an error', async () => {
				const { systemId, expectedError } = setup();

				await expect(uc.findUsersToSynchronize(systemId)).rejects.toThrowError(expectedError);
			});
		});
	});

	describe('updateSynchronization', () => {
		describe('when update synchronization', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const synchronization = synchronizationFactory.buildWithId();
				const synchronizationId = synchronization.id;
				const usersToCheck = [new ObjectId().toHexString(), new ObjectId().toHexString()];
				const userSyncCount = 2;
				const status = SynchronizationStatusModel.SUCCESS;
				const synchronizationToUpdate = {
					...synchronization,
					count: userSyncCount,
					status,
				} as Synchronization;

				synchronizationService.findById.mockResolvedValueOnce(synchronization);

				return {
					status,
					synchronizationId,
					synchronizationToUpdate,
					systemId,
					userSyncCount,
					usersToCheck,
				};
			};

			it('should call the synchronizationService.findById to find the synchronization', async () => {
				const { synchronizationId, status, userSyncCount } = setup();

				await uc.updateSynchronization(synchronizationId, status, userSyncCount);

				expect(synchronizationService.findById).toHaveBeenCalledWith(synchronizationId);
			});

			it('should call the synchronizationService.update to log detainls about synchronization of systemId', async () => {
				const { synchronizationId, synchronizationToUpdate, status, userSyncCount } = setup();

				await uc.updateSynchronization(synchronizationId, status, userSyncCount);

				expect(synchronizationService.update).toHaveBeenCalledWith(synchronizationToUpdate);
			});
		});
	});

	describe('updateLastSyncedAt', () => {
		describe('when searching users to update and update them', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const userAId = new ObjectId().toHexString();
				const userBId = new ObjectId().toHexString();
				const usersToCheck = [userAId, userBId];
				const usersToSync = [userAId, userBId];
				const userSyncCount = 2;

				userService.findByExternalIdsAndProvidedBySystemId.mockResolvedValueOnce(usersToSync);

				return {
					systemId,
					userSyncCount,
					usersToCheck,
					usersToSync,
				};
			};

			it('should call the userService.findByExternalIdsAndProvidedBySystemId to get array of users to sync', async () => {
				const { systemId, usersToCheck } = setup();

				await uc.updateLastSyncedAt(usersToCheck, systemId);

				expect(userService.findByExternalIdsAndProvidedBySystemId).toHaveBeenCalledWith(usersToCheck, systemId);
			});

			it('should call the userService.updateLastSyncedAt to update users', async () => {
				const { systemId, usersToCheck, usersToSync } = setup();

				await uc.updateLastSyncedAt(usersToCheck, systemId);

				expect(userService.updateLastSyncedAt).toHaveBeenCalledWith(usersToSync);
			});

			it('should return number of user with updateLastCyncedAt', async () => {
				const { systemId, usersToCheck, userSyncCount } = setup();

				const result = await uc.updateLastSyncedAt(usersToCheck, systemId);

				expect(result).toEqual(userSyncCount);
			});
		});
	});
});
