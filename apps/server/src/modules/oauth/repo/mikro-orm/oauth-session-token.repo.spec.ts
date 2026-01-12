import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { OauthSessionTokenEntity } from '../../entity';
import { oauthSessionTokenEntityFactory, oauthSessionTokenFactory } from '../../testing';
import { OAUTH_SESSION_TOKEN_REPO } from '../oauth-session-token.repo.interface';
import { OauthSessionTokenMikroOrmRepo } from './oauth-session-token.repo';

describe(OauthSessionTokenMikroOrmRepo.name, () => {
	let module: TestingModule;
	let repo: OauthSessionTokenMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [OauthSessionTokenEntity] })],
			providers: [{ provide: OAUTH_SESSION_TOKEN_REPO, useClass: OauthSessionTokenMikroOrmRepo }],
		}).compile();

		repo = module.get(OAUTH_SESSION_TOKEN_REPO);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('save', () => {
		describe('when a new object is provided', () => {
			const setup = () => {
				const oauthSessionToken = oauthSessionTokenFactory.build();

				return {
					oauthSessionToken,
				};
			};

			it('should create a new entity', async () => {
				const { oauthSessionToken } = setup();

				await repo.save(oauthSessionToken);

				await expect(em.findOneOrFail(OauthSessionTokenEntity, oauthSessionToken.id)).resolves.toBeDefined();
			});

			it('should return the object', async () => {
				const { oauthSessionToken } = setup();

				const result = await repo.save(oauthSessionToken);

				expect(result).toEqual(oauthSessionToken);
			});
		});

		describe('when an entity with the id exists', () => {
			const setup = async () => {
				const oauthSessionTokenId = new ObjectId().toHexString();
				const oauthSessionTokenEntity = oauthSessionTokenEntityFactory.build({
					id: oauthSessionTokenId,
					refreshToken: 'token1',
				});

				await em.persist(oauthSessionTokenEntity).flush();
				em.clear();

				const oauthSessionToken = oauthSessionTokenFactory.build({ id: oauthSessionTokenId, refreshToken: 'token2' });

				return {
					oauthSessionToken,
				};
			};

			it('should update the entity', async () => {
				const { oauthSessionToken } = await setup();

				await repo.save(oauthSessionToken);

				await expect(em.findOneOrFail(OauthSessionTokenEntity, oauthSessionToken.id)).resolves.toEqual(
					expect.objectContaining({ refreshToken: 'token2' })
				);
			});

			it('should return the object', async () => {
				const { oauthSessionToken } = await setup();

				const result = await repo.save(oauthSessionToken);

				expect(result).toEqual(oauthSessionToken);
			});
		});
	});

	describe('findLatestByUserId', () => {
		describe('when a user without a saved session token is provided', () => {
			const setup = async () => {
				const sessionTokens = oauthSessionTokenEntityFactory.buildListWithId(3);

				await em.persist(sessionTokens).flush();
				em.clear();

				const user = userFactory.build();
				const userId = user.id;

				return {
					userId,
				};
			};

			it('should return null', async () => {
				const { userId } = await setup();

				const result = await repo.findLatestByUserId(userId);

				expect(result).toBeNull();
			});
		});

		describe('when a user with several saved session tokens is provided', () => {
			const setup = async () => {
				const user = userFactory.build();

				const sessionTokens = [1, 5, 10].map((i) =>
					oauthSessionTokenEntityFactory.build({
						expiresAt: new Date(Date.now() + i * 3600 * 1000),
						user,
					})
				);

				const latestSessionToken = oauthSessionTokenEntityFactory.build({
					expiresAt: new Date(Date.now() + 100 * 3600 * 1000),
					user,
				});

				await em.persist([user, ...sessionTokens, latestSessionToken]).flush();
				em.clear();

				const expectedTokenEntity: OauthSessionTokenEntity = latestSessionToken;
				const latestExpiredAt = latestSessionToken.expiresAt;

				const expectedToken = oauthSessionTokenFactory.build({
					id: expectedTokenEntity.id,
					refreshToken: expectedTokenEntity.refreshToken,
					systemId: expectedTokenEntity.system.id,
					expiresAt: expectedTokenEntity.expiresAt,
					userId: user.id,
				});

				return {
					expectedToken,
					latestExpiredAt,
					userId: user.id,
				};
			};

			it('should return the latest session token domain object', async () => {
				const { expectedToken, latestExpiredAt, userId } = await setup();

				const result = await repo.findLatestByUserId(userId);

				expect(result).toEqual(expectedToken);
				expect(result?.expiresAt).toEqual(latestExpiredAt);
			});
		});
	});
});
