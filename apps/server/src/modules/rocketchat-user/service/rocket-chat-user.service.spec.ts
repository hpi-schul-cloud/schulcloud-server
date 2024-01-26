import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { DomainModel, OperationType } from '@shared/domain/types';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { DomainOperation } from '@shared/domain/interface';
import { RocketChatUserService } from './rocket-chat-user.service';
import { RocketChatUserRepo } from '../repo';
import { rocketChatUserFactory } from '../domain/testing/rocket-chat-user.factory';
import { RocketChatUser } from '../domain';

describe(RocketChatUserService.name, () => {
	let module: TestingModule;
	let service: RocketChatUserService;
	let rocketChatUserRepo: DeepMocked<RocketChatUserRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RocketChatUserService,
				{
					provide: RocketChatUserRepo,
					useValue: createMock<RocketChatUserRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(RocketChatUserService);
		rocketChatUserRepo = module.get(RocketChatUserRepo);

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

				const expectedResult = DomainOperationBuilder.build(DomainModel.ROCKETCHATUSER, OperationType.DELETE, 1, [
					rocketChatUser.id,
				]);

				return {
					userId,
					expectedResult,
				};
			};

			it('should call rocketChatUserRepo', async () => {
				const { userId } = setup();

				await service.deleteByUserId(userId);

				expect(rocketChatUserRepo.findByUserId).toBeCalledWith(userId);
				expect(rocketChatUserRepo.deleteByUserId).toBeCalledWith(userId);
			});

			it('should delete rocketChatUser by userId', async () => {
				const { userId, expectedResult } = setup();

				const result: DomainOperation = await service.deleteByUserId(userId);

				expect(result).toEqual(expectedResult);
			});
		});
	});
});
