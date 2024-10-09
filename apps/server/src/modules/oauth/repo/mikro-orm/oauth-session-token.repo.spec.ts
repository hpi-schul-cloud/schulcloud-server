import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
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
				const oauthSessionTokenEntity = oauthSessionTokenEntityFactory.buildWithId(
					{ refreshToken: 'token1' },
					oauthSessionTokenId
				);

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
});
