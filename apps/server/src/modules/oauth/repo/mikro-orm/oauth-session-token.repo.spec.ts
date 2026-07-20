import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, type EncryptionService } from '@infra/encryption';
import { EntityManager } from '@mikro-orm/mongodb';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { userFactory } from '@modules/user/testing';
import { Test, type TestingModule } from '@nestjs/testing';
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
	let encryptionService: DeepMocked<EncryptionService>;

	const cipherText = 'someCipherText';

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [OauthSessionTokenEntity, SchoolSystemOptionsEntity, UserLoginMigrationEntity],
				}),
			],
			providers: [
				{ provide: OAUTH_SESSION_TOKEN_REPO, useClass: OauthSessionTokenMikroOrmRepo },
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		repo = module.get(OAUTH_SESSION_TOKEN_REPO);
		em = module.get(EntityManager);
		encryptionService = module.get(DefaultEncryptionService);

		encryptionService.encrypt.mockReturnValue(cipherText);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('save', () => {
		it('should insert a new token', async () => {
			const oauthSessionToken = oauthSessionTokenFactory.build();

			await repo.save(oauthSessionToken);

			await expect(em.findOneOrFail(OauthSessionTokenEntity, oauthSessionToken.id)).resolves.toBeDefined();
		});

		it('should encrypt the refresh token', async () => {
			const oauthSessionToken = oauthSessionTokenFactory.build();

			await repo.save(oauthSessionToken);

			const savedToken = await em.findOneOrFail(OauthSessionTokenEntity, oauthSessionToken.id);
			expect(savedToken.refreshToken).not.toEqual(oauthSessionToken.refreshToken);
			expect(savedToken.refreshToken).toEqual(cipherText);
		});
	});

	describe('delete', () => {
		it('should delete the given token', async () => {
			const token = oauthSessionTokenFactory.build();
			await repo.save(token);
			em.clear();

			await repo.delete(token);

			await expect(em.findOneOrFail(OauthSessionTokenEntity, token.id)).rejects.toThrow();
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

				const decryptedRefreshToken = 'somePlainText';
				encryptionService.decrypt.mockReturnValueOnce(decryptedRefreshToken);

				const expectedToken = oauthSessionTokenFactory.build({
					id: latestSessionToken.id,
					refreshToken: decryptedRefreshToken,
					systemId: latestSessionToken.system.id,
					expiresAt: latestSessionToken.expiresAt,
					userId: user.id,
				});

				return {
					expectedToken,
					userId: user.id,
				};
			};

			it('should return the latest session token domain object', async () => {
				const { expectedToken, userId } = await setup();

				const result = await repo.findLatestByUserId(userId);

				expect(result).toEqual(expectedToken);
			});
		});
	});
});
