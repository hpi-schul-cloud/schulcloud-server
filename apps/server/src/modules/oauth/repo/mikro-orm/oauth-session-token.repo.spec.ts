import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, userFactory } from '@shared/testing';
import { SortOrder, SortOrderMap } from '@shared/domain/interface';
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
			imports: [MongoMemoryDatabaseModule.forRoot()],
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

				await em.persistAndFlush(oauthSessionTokenEntity);
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

	describe('findOneByUserId', () => {
		describe('when a user with a saved session token is provided', () => {
			const setup = async () => {
				const sessionTokens = oauthSessionTokenEntityFactory.buildListWithId(3);

				await em.persistAndFlush(sessionTokens);

				const expectedTokenEntity: OauthSessionTokenEntity = sessionTokens[0];
				const userId: string = expectedTokenEntity.user.id;

				const expectedToken = oauthSessionTokenFactory.build({
					id: expectedTokenEntity.id,
					refreshToken: expectedTokenEntity.refreshToken,
					systemId: expectedTokenEntity.system.id,
					expiresAt: expectedTokenEntity.expiresAt,
					userId,
				});

				return {
					expectedToken,
					userId,
				};
			};

			it('should return a session token domain object', async () => {
				const { expectedToken, userId } = await setup();

				const result = await repo.findOneByUserId(userId);

				expect(result).toEqual(expectedToken);
			});
		});

		describe('when a user without a saved session token is provided', () => {
			const setup = async () => {
				const sessionTokens = oauthSessionTokenEntityFactory.buildListWithId(3);

				await em.persistAndFlush(sessionTokens);

				const user = userFactory.build();
				const userId = user.id;

				return {
					userId,
				};
			};

			it('should return null', async () => {
				const { userId } = await setup();

				const result = await repo.findOneByUserId(userId);

				expect(result).toBeNull();
			});
		});

		describe('when a user with a saved session token and a sort option is provided ', () => {
			const setup = async () => {
				const sessionTokens = [1, 5, 10].map((i) =>
					oauthSessionTokenEntityFactory.build({
						expiresAt: new Date(Date.now() + i * 3600 * 1000),
					})
				);

				await em.persistAndFlush(sessionTokens);

				const sortOption: SortOrderMap<OauthSessionTokenEntity> = { expiresAt: SortOrder.asc };
				const expectedTokenEntity: OauthSessionTokenEntity = sessionTokens[sessionTokens.length - 1];

				const userId: string = expectedTokenEntity.user.id;

				const expectedToken = oauthSessionTokenFactory.build({
					id: expectedTokenEntity.id,
					refreshToken: expectedTokenEntity.refreshToken,
					systemId: expectedTokenEntity.system.id,
					expiresAt: expectedTokenEntity.expiresAt,
					userId,
				});

				return {
					expectedToken,
					userId,
					sortOption,
				};
			};

			it('should return the first session token based on the sort option', async () => {
				const { expectedToken, userId, sortOption } = await setup();

				const result = await repo.findOneByUserId(userId, sortOption);

				expect(result).toEqual(expectedToken);
			});
		});
	});
});
