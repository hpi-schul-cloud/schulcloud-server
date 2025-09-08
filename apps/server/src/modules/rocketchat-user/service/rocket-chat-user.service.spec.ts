import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { RocketChatService } from '@modules/rocketchat/rocket-chat.service';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { RocketChatUser } from '../domain';
import { rocketChatUserFactory } from '../domain/testing/rocket-chat-user.factory';
import { RocketChatUserEntity } from '../entity';
import { RocketChatUserRepo } from '../repo';
import { RocketChatUserService } from './rocket-chat-user.service';

describe(RocketChatUserService.name, () => {
	let module: TestingModule;
	let service: RocketChatUserService;
	let rocketChatUserRepo: DeepMocked<RocketChatUserRepo>;

	beforeAll(async () => {
		await setupEntities([RocketChatUserEntity]);

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
			],
		}).compile();

		service = module.get(RocketChatUserService);
		rocketChatUserRepo = module.get(RocketChatUserRepo);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findByUserId', () => {
		describe('when rocketChatUser exists', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();

				const rocketChatUser: RocketChatUser = rocketChatUserFactory.build();

				rocketChatUserRepo.findByUserId.mockResolvedValueOnce(rocketChatUser);

				return {
					userId,
					rocketChatUser,
				};
			};

			it('should return the rocketChatUser', async () => {
				const { userId, rocketChatUser } = setup();

				const result = await service.findByUserId(userId);

				expect(result).toEqual(rocketChatUser);
			});
		});

		describe('when rocketChatUser does not exist', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();

				rocketChatUserRepo.findByUserId.mockResolvedValueOnce(null);

				return {
					userId,
				};
			};

			it('should return null ', async () => {
				const { userId } = setup();

				const result = await service.findByUserId(userId);

				expect(result).toBeNull();
			});
		});
	});
});
