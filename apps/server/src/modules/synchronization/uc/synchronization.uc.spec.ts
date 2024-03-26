import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { Logger } from '@src/core/logger';
import { UserService } from '@modules/user';
import { SanisResponse, SchulconnexRestClient, schulconnexResponseFactory } from '@src/infra/schulconnex-client';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { SynchronizationService } from '../domain/service';
import { SynchronizationUc } from './synchronization.uc';
import { SynchronizationStatusModel } from '../domain/types';
import { synchronizationFactory } from '../domain/testing';
import { Synchronization } from '../domain';
import { synchronizationTestConfig } from './testing';
import {
	FailedUpdateLastSyncedAtLoggableException,
	NoUsersToSynchronizationLoggableException,
} from '../domain/loggable-exception';

describe(SynchronizationUc.name, () => {
	let module: TestingModule;
	let uc: SynchronizationUc;
	let userService: DeepMocked<UserService>;
	let synchronizationService: DeepMocked<SynchronizationService>;
	let schulconnexRestClient: DeepMocked<SchulconnexRestClient>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ConfigModule.forRoot(createConfigModuleOptions(synchronizationTestConfig))],
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
		describe('when update users lastSynceAt for systemId', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const synchronizationId = new ObjectId().toHexString();
				const usersToCheck = [new ObjectId().toHexString()];
				const userSyncCount = 1;
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

			it('should call the uc.updateLastSyncedAt to update users for systemId twice', async () => {
				const { spyUpdateLastSyncedAt, systemId, usersToCheck } = setup();

				await uc.updateSystemUsersLastSyncedAt(systemId);

				expect(spyUpdateLastSyncedAt).toHaveBeenCalledWith([usersToCheck[0]], systemId);
				expect(spyUpdateLastSyncedAt).toHaveBeenCalledTimes(1);
			});

			it('should call the uc.updateSynchronization to log detainls about synchronization of systemId', async () => {
				const { spyUpdateSynchronization, status, synchronizationId, systemId, userSyncCount } = setup();
				jest.spyOn(uc, 'updateLastSyncedAt').mockResolvedValueOnce(userSyncCount);

				await uc.updateSystemUsersLastSyncedAt(systemId);

				expect(spyUpdateSynchronization).toHaveBeenCalledWith(synchronizationId, status, userSyncCount);
			});
		});

		describe('when found no users to update for systemId', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const synchronizationId = new ObjectId().toHexString();
				const userSyncCount = 0;
				const status = SynchronizationStatusModel.FAILED;

				const errorMessage = {
					type: 'SYNCHRONIZATION_ERROR',
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					data: expect.objectContaining({
						systemId,
						errorMessage: 'No users to check from system',
					}),
				};

				synchronizationService.createSynchronization.mockResolvedValueOnce(synchronizationId);
				schulconnexRestClient.getPersonenInfo.mockResolvedValueOnce([]);
				const spyUpdateSynchronization = jest.spyOn(uc, 'updateSynchronization');

				return {
					errorMessage,
					spyUpdateSynchronization,
					status,
					synchronizationId,
					systemId,
					userSyncCount,
				};
			};

			it('should call the uc.updateSynchronization to log details about synchronization of systemId', async () => {
				const { errorMessage, spyUpdateSynchronization, status, synchronizationId, systemId, userSyncCount } = setup();

				await uc.updateSystemUsersLastSyncedAt(systemId);

				expect(spyUpdateSynchronization).toHaveBeenCalledWith(
					synchronizationId,
					status,
					userSyncCount,
					expect.objectContaining(errorMessage)
				);
			});
		});

		describe('when failed to update lastSyncedAt field for users provisioned by system', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const synchronizationId = new ObjectId().toHexString();
				const usersToCheck = [new ObjectId().toHexString()];
				const userSyncCount = 0;
				const status = SynchronizationStatusModel.FAILED;

				const error = new Error('testError');
				const errorMessage = {
					type: 'SYNCHRONIZATION_ERROR',
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					data: expect.objectContaining({
						systemId,
						errorMessage: 'Failed to update lastSyncedAt field for users provisioned by system',
					}),
				};

				synchronizationService.createSynchronization.mockResolvedValueOnce(synchronizationId);
				jest.spyOn(uc, 'findUsersToSynchronize').mockResolvedValueOnce(usersToCheck);
				userService.updateLastSyncedAt.mockRejectedValueOnce(error);
				const spyUpdateSynchronization = jest.spyOn(uc, 'updateSynchronization');

				return {
					errorMessage,
					spyUpdateSynchronization,
					status,
					synchronizationId,
					systemId,
					userSyncCount,
					usersToCheck,
				};
			};

			it('should call the uc.updateSynchronization to log details about synchronization of systemId', async () => {
				const { errorMessage, spyUpdateSynchronization, status, synchronizationId, systemId, userSyncCount } = setup();

				await uc.updateSystemUsersLastSyncedAt(systemId);

				expect(spyUpdateSynchronization).toHaveBeenCalledWith(
					synchronizationId,
					status,
					userSyncCount,
					expect.objectContaining(errorMessage)
				);
			});
		});

		describe('when an error occurred during the synchronisation process ', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const synchronizationId = new ObjectId().toHexString();
				const userSyncCount = 0;
				const status = SynchronizationStatusModel.FAILED;

				const errorMessage = {
					type: 'SYNCHRONIZATION_ERROR',
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					data: expect.objectContaining({
						systemId,
						errorMessage: 'Unknonw error during synchronisation process for users provisioned by system',
					}),
				};

				synchronizationService.createSynchronization.mockResolvedValueOnce(synchronizationId);
				schulconnexRestClient.getPersonenInfo.mockRejectedValueOnce(new Error('fail'));
				const spyUpdateSynchronization = jest.spyOn(uc, 'updateSynchronization');

				return {
					errorMessage,
					spyUpdateSynchronization,
					status,
					synchronizationId,
					systemId,
					userSyncCount,
				};
			};

			it('should call the uc.updateSynchronization to log detainls about synchronization of systemId', async () => {
				const { errorMessage, spyUpdateSynchronization, status, synchronizationId, systemId, userSyncCount } = setup();

				await uc.updateSystemUsersLastSyncedAt(systemId);

				expect(spyUpdateSynchronization).toHaveBeenCalledWith(
					synchronizationId,
					status,
					userSyncCount,
					expect.objectContaining(errorMessage)
				);
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

			it('should split array to 3 chunks', () => {
				const array = ['a', 'b', 'c'];

				expect(uc.chunkArray(array, 1).length).toBe(3);
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

				const expectedError = new NoUsersToSynchronizationLoggableException(systemId);

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

		describe('when updating users and got error from userService', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const userAId = new ObjectId().toHexString();
				const userBId = new ObjectId().toHexString();
				const usersToCheck = [userAId, userBId];
				const usersToSync = [userAId, userBId];

				userService.findByExternalIdsAndProvidedBySystemId.mockResolvedValueOnce(usersToSync);

				const error = new Error('testError');
				const expectedError = new FailedUpdateLastSyncedAtLoggableException(systemId);
				userService.updateLastSyncedAt.mockRejectedValueOnce(error);

				return {
					expectedError,
					systemId,
					usersToCheck,
				};
			};

			it('should throw an error', async () => {
				const { expectedError, usersToCheck, systemId } = setup();

				await expect(uc.updateLastSyncedAt(usersToCheck, systemId)).rejects.toThrowError(expectedError);
			});
		});
	});

	describe('chunkArray', () => {
		describe('when chunkArray is called', () => {
			const setup = () => {
				const array = ['a', 'b', 'c'];
				const chunkSize = 1;

				return {
					array,
					chunkSize,
				};
			};

			it('should split array to 3 chunks', () => {
				const { array, chunkSize } = setup();

				expect(uc.chunkArray(array, chunkSize).length).toBe(3);
			});
		});
	});
});
