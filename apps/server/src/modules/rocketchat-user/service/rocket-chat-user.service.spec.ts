import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { DomainName, OperationType } from '@shared/domain/types';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@shared/domain/builder';
import { DomainDeletionReport } from '@shared/domain/interface';
import { EventBus } from '@nestjs/cqrs';
import { RocketChatService } from '@modules/rocketchat/rocket-chat.service';
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
		describe('when deleting rocketChatUser', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const rocketChatUser: RocketChatUser = rocketChatUserFactory.build();

				rocketChatUserRepo.findByUserId.mockResolvedValueOnce([rocketChatUser]);
				rocketChatUserRepo.deleteByUserId.mockResolvedValueOnce(1);
				rocketChatService.deleteUser.mockResolvedValueOnce({ success: true });

				const expectedResult = DomainDeletionReportBuilder.build(
					DomainName.ROCKETCHATUSER,
					[DomainOperationReportBuilder.build(OperationType.DELETE, 1, [rocketChatUser.id])],
					DomainDeletionReportBuilder.build(DomainName.ROCKETCHATSERVICE, [
						DomainOperationReportBuilder.build(OperationType.DELETE, 1, [rocketChatUser.username]),
					])
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

			it('should delete rocketChatUser by userId', async () => {
				const { userId, expectedResult } = setup();

				const result: DomainDeletionReport = await service.deleteUserData(userId);

				expect(result).toEqual(expectedResult);
			});
		});
	});
});
