import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { cleanupCollections } from '@shared/testing';
import { RocketChatUserMapper } from './mapper';
import { RocketChatUserEntity } from '../entity';
import { RocketChatUserRepo } from './rocket-chat-user.repo';
import { rocketChatUserEntityFactory } from '../entity/testing';

describe(RocketChatUserRepo.name, () => {
	let module: TestingModule;
	let repo: RocketChatUserRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [RocketChatUserEntity],
				}),
			],
			providers: [RocketChatUserRepo, RocketChatUserMapper],
		}).compile();

		repo = module.get(RocketChatUserRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
			expect(typeof repo.findByUserId).toEqual('function');
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});

		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(RocketChatUserEntity);
		});
	});

	describe('findByUserId', () => {
		describe('when searching rocketChatUser by userId', () => {
			const setup = async () => {
				const userId = new ObjectId();
				const entity: RocketChatUserEntity = rocketChatUserEntityFactory.build({ userId });
				await em.persistAndFlush(entity);
				em.clear();
				const expectedRocketChatUser = {
					id: entity.id,
					userId: entity.userId.toHexString(),
					username: entity.username,
					rcId: entity.rcId,
					authToken: entity.authToken,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				};
				return {
					entity,
					expectedRocketChatUser,
				};
			};

			it('should find the rocketChatUser', async () => {
				const { entity, expectedRocketChatUser } = await setup();

				const result = await repo.findByUserId(entity.userId.toHexString());

				// Verify explicit fields.
				expect(result).toEqual(expect.objectContaining(expectedRocketChatUser));
			});
		});

		describe('when rocketChatUser does not exist', () => {
			const setup = () => {
				const userId = new ObjectId();

				return {
					userId,
				};
			};

			it('should return null', async () => {
				const { userId } = setup();

				const result = await repo.findByUserId(userId.toHexString());

				expect(result).toBeNull();
			});
		});
	});

	describe('deleteByUserId', () => {
		describe('when deleting rocketChatUser exists', () => {
			const setup = async () => {
				const entity: RocketChatUserEntity = rocketChatUserEntityFactory.build();
				const rocketChatUserId = entity.userId.toHexString();
				await em.persistAndFlush(entity);
				em.clear();

				return { rocketChatUserId };
			};

			it('should delete the rocketChatUSer with userId', async () => {
				const { rocketChatUserId } = await setup();

				await repo.deleteByUserId(rocketChatUserId);

				expect(await em.findOne(RocketChatUserEntity, { userId: new ObjectId(rocketChatUserId) })).toBeNull();
			});

			it('should return number equal 1', async () => {
				const { rocketChatUserId } = await setup();

				const result: number = await repo.deleteByUserId(rocketChatUserId);

				expect(result).toEqual(1);
			});
		});

		describe('when no rocketChatUser exists', () => {
			const setup = () => {
				const rocketChatUserId = new ObjectId().toHexString();

				return { rocketChatUserId };
			};

			it('should return false', async () => {
				const { rocketChatUserId } = setup();

				const result: number = await repo.deleteByUserId(rocketChatUserId);

				expect(result).toEqual(0);
			});
		});
	});
});
