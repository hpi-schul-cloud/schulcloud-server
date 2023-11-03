import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { RocketChatUserMapper } from './mapper';
import { RocketChatUserEntity } from '../entity';
import { RocketChatUserRepo } from './rocket-chat-user.repo';
import { rocketChatUserEntityFactory } from '../entity/testing/rocket-chat-user.entity.factory';
import { RocketChatUser } from '../domain/rocket-chat-user.do';

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
		await em.nativeDelete(RocketChatUserEntity, {});
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});

		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(RocketChatUserEntity);
		});
	});

	describe('findByUserId', () => {
		describe('when searching by userId', () => {
			const setup = async () => {
				// const rocketChatUserId = new ObjectId().toHexString();

				// const entity: RocketChatUserEntity = rocketChatUserEntityFactory.build({ userId: rocketChatUserId });
				const entity: RocketChatUserEntity = rocketChatUserEntityFactory.build();
				await em.persistAndFlush(entity);
				em.clear();
				const expectedRocketChatUser = {
					id: entity.id,
					userId: entity.userId,
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

				const result: RocketChatUser = await repo.findByUserId(entity.userId);

				// Verify explicit fields.
				expect(result).toEqual(expect.objectContaining(expectedRocketChatUser));
			});
		});
	});

	describe('deleteById', () => {
		describe('when deleting deletionRequest exists', () => {
			const setup = async () => {
				const entity: RocketChatUserEntity = rocketChatUserEntityFactory.build();
				const rocketChatUserId = entity.userId;
				await em.persistAndFlush(entity);
				em.clear();

				return { rocketChatUserId };
			};

			it('should delete the deletionRequest with deletionRequestId', async () => {
				const { rocketChatUserId } = await setup();

				await repo.deleteByUserId(rocketChatUserId);

				expect(await em.findOne(RocketChatUserEntity, { userId: rocketChatUserId })).toBeNull();
			});

			it('should return true', async () => {
				const { rocketChatUserId } = await setup();

				const result: boolean = await repo.deleteByUserId(rocketChatUserId);

				expect(result).toEqual(true);
			});
		});

		describe('when no deletionRequestEntity exists', () => {
			const setup = () => {
				const rocketChatUserId = new ObjectId().toHexString();

				return { rocketChatUserId };
			};

			it('should return false', async () => {
				const { rocketChatUserId } = setup();

				const result: boolean = await repo.deleteByUserId(rocketChatUserId);

				expect(result).toEqual(false);
			});
		});
	});
});
