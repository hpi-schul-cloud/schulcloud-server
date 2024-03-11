import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { DomainName, OperationType } from '@shared/domain/types';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@shared/domain/builder';
import { EventBus } from '@nestjs/cqrs';
import { RocketChatService } from '@modules/rocketchat/rocket-chat.service';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { DataDeletedEvent } from '@modules/deletion';
import { DomainDeletionReport } from '@shared/domain/interface';
import { DeletionErrorLoggableException } from '@shared/common/loggable-exception';
import { RocketChatUserService } from './rocket-chat-user.service';
import { RocketChatUserRepo } from '../repo';
import { rocketChatUserFactory } from '../domain/testing/rocket-chat-user.factory';
import { RocketChatUser } from '../domain';

describe(RocketChatUserService.name, () => {
	let module: TestingModule;
	let service: RocketChatUserService;
	let rocketChatUserRepo: DeepMocked<RocketChatUserRepo>;
	let rocketChatService: DeepMocked<RocketChatService>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RocketChatUserService,
				{
					provide: RocketChatUserRepo,
					useValue: createMock<RocketChatUserRepo>(),
				},
				{
					provide: RocketChatService,
					useValue: createMock<RocketChatService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get(RocketChatUserService);
		rocketChatUserRepo = module.get(RocketChatUserRepo);
		rocketChatService = module.get(RocketChatService);
		eventBus = module.get(EventBus);

		await setupEntities();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findByUserId', () => {
		describe('when searching rocketChatUser', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();

				const rocketChatUser: RocketChatUser = rocketChatUserFactory.build();

				rocketChatUserRepo.findByUserId.mockResolvedValueOnce([rocketChatUser]);

				return {
					userId,
					rocketChatUser,
				};
			};

			it('should return the rocketChatUser', async () => {
				const { userId, rocketChatUser } = setup();

				const result: RocketChatUser[] = await service.findByUserId(userId);

				expect(result[0]).toEqual(rocketChatUser);
			});
		});
	});

	describe('delete RocketChatUser', () => {
		describe('when rocketChatUser does not exist', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();

				rocketChatUserRepo.findByUserId.mockResolvedValueOnce([]);

				const expectedResult = DomainDeletionReportBuilder.build(
					DomainName.ROCKETCHATUSER,
					[DomainOperationReportBuilder.build(OperationType.DELETE, 0, [])],
					[
						DomainDeletionReportBuilder.build(DomainName.ROCKETCHATSERVICE, [
							DomainOperationReportBuilder.build(OperationType.DELETE, 0, []),
						]),
					]
				);

				return {
					userId,
					expectedResult,
				};
			};

			it('should call rocketChatUserRepo', async () => {
				const { userId } = setup();

				await service.deleteUserData(userId);

				expect(rocketChatUserRepo.findByUserId).toBeCalledWith(userId);
			});

			it('should return domainOperation object with information about deleted user', async () => {
				const { userId, expectedResult } = setup();

				const result = await service.deleteUserData(userId);

				expect(result).toEqual(expectedResult);
			});

			it('should Not call rocketChatUserRepo.deleteByUserId with userId', async () => {
				const { userId } = setup();

				await service.deleteUserData(userId);

				expect(rocketChatUserRepo.deleteByUserId).not.toHaveBeenCalled();
			});
		});

		describe('when rocketChatUser exists', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const rocketChatUser: RocketChatUser = rocketChatUserFactory.build();

				rocketChatUserRepo.findByUserId.mockResolvedValueOnce([rocketChatUser]);
				rocketChatUserRepo.deleteByUserId.mockResolvedValueOnce(1);
				rocketChatService.deleteUser.mockResolvedValueOnce({ success: true });

				const expectedResult = DomainDeletionReportBuilder.build(
					DomainName.ROCKETCHATUSER,
					[DomainOperationReportBuilder.build(OperationType.DELETE, 1, [rocketChatUser.id])],
					[
						DomainDeletionReportBuilder.build(DomainName.ROCKETCHATSERVICE, [
							DomainOperationReportBuilder.build(OperationType.DELETE, 1, [rocketChatUser.username]),
						]),
					]
				);

				return {
					userId,
					expectedResult,
					rocketChatUser,
				};
			};

			it('should call rocketChatUserRepo', async () => {
				const { userId } = setup();

				await service.deleteUserData(userId);

				expect(rocketChatUserRepo.findByUserId).toBeCalledWith(userId);
			});

			it('should call rocketChatService.deleteUser with username', async () => {
				const { rocketChatUser, userId } = setup();

				await service.deleteUserData(userId);

				expect(rocketChatService.deleteUser).toBeCalledWith(rocketChatUser.username);
			});

			it('should call rocketChatUserRepo.deleteByUserId with userId', async () => {
				const { rocketChatUser, userId } = setup();

				await service.deleteUserData(userId);

				expect(rocketChatUserRepo.deleteByUserId).toBeCalledWith(rocketChatUser.userId);
			});

			it('should return domainOperation object with information about deleted user', async () => {
				const { userId, expectedResult } = setup();

				const result: DomainDeletionReport = await service.deleteUserData(userId);

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when rocketChatUser exists and failed to delete this user', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const rocketChatUser: RocketChatUser = rocketChatUserFactory.build();

				rocketChatUserRepo.findByUserId.mockResolvedValueOnce([rocketChatUser]);
				rocketChatUserRepo.deleteByUserId.mockResolvedValueOnce(1);
				rocketChatService.deleteUser.mockRejectedValueOnce(new Error());

				const expectedError = `Failed to delete user data for userId '${userId}' from RocketChatUser collection / RocketChat service`;

				return {
					expectedError,
					userId,
				};
			};

			it('should throw an error', async () => {
				const { expectedError, userId } = setup();

				await expect(service.deleteUserData(userId)).rejects.toThrowError(
					new DeletionErrorLoggableException(expectedError)
				);
			});
		});
	});

	describe('handle', () => {
		const setup = () => {
			const targetRefId = new ObjectId().toHexString();
			const targetRefDomain = DomainName.ROCKETCHATUSER;
			const deletionRequest = deletionRequestFactory.build({ targetRefId, targetRefDomain });

			const expectedData = DomainDeletionReportBuilder.build(DomainName.ROCKETCHATUSER, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			]);

			return {
				deletionRequest,
				expectedData,
			};
		};

		describe('when UserDeletedEvent is received', () => {
			it('should call deleteUserData in classService', async () => {
				const { deletionRequest, expectedData } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequest });

				expect(service.deleteUserData).toHaveBeenCalledWith(deletionRequest.targetRefId);
			});

			it('should call eventBus.publish with DataDeletedEvent', async () => {
				const { deletionRequest, expectedData } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequest });

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequest, expectedData));
			});
		});
	});
});
