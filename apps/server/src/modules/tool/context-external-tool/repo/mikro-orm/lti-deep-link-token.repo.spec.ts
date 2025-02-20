import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { LtiDeepLinkToken } from '../../domain';
import { ltiDeepLinkTokenEntityFactory, ltiDeepLinkTokenFactory } from '../../testing';
import { LTI_DEEP_LINK_TOKEN_REPO } from '../lti-deep-link-token.repo.interface';
import { LtiDeepLinkTokenMikroOrmRepo } from './lti-deep-link-token.repo';
import { LtiDeepLinkTokenEntityMapper } from './mapper';
import { LtiDeepLinkTokenEntity } from './lti-deep-link-token.entity';

describe(LtiDeepLinkTokenMikroOrmRepo.name, () => {
	let module: TestingModule;
	let repo: LtiDeepLinkTokenMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [LtiDeepLinkTokenEntity] })],
			providers: [{ provide: LTI_DEEP_LINK_TOKEN_REPO, useClass: LtiDeepLinkTokenMikroOrmRepo }],
		}).compile();

		repo = module.get(LTI_DEEP_LINK_TOKEN_REPO);
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
				const ltiDeepLinkToken = ltiDeepLinkTokenFactory.build();

				return {
					ltiDeepLinkToken,
				};
			};

			it('should create a new entity', async () => {
				const { ltiDeepLinkToken } = setup();

				await repo.save(ltiDeepLinkToken);

				await expect(em.findOneOrFail(LtiDeepLinkTokenEntity, ltiDeepLinkToken.id)).resolves.toBeDefined();
			});

			it('should return the object', async () => {
				const { ltiDeepLinkToken } = setup();

				const result = await repo.save(ltiDeepLinkToken);

				expect(result).toEqual(ltiDeepLinkToken);
			});
		});

		describe('when an entity with the id exists', () => {
			const setup = async () => {
				const ltiDeepLinkTokenEntity = ltiDeepLinkTokenEntityFactory.build({
					state: 'token1',
				});

				await em.persistAndFlush(ltiDeepLinkTokenEntity);
				em.clear();

				const ltiDeepLinkToken = new LtiDeepLinkToken({
					...LtiDeepLinkTokenEntityMapper.mapEntityToDo(ltiDeepLinkTokenEntity).getProps(),
					state: 'token2',
				});

				return {
					ltiDeepLinkToken,
				};
			};

			it('should update the entity', async () => {
				const { ltiDeepLinkToken } = await setup();

				await repo.save(ltiDeepLinkToken);

				await expect(em.findOneOrFail(LtiDeepLinkTokenEntity, ltiDeepLinkToken.id)).resolves.toEqual(
					expect.objectContaining({ state: 'token2' })
				);
			});

			it('should return the object', async () => {
				const { ltiDeepLinkToken } = await setup();

				const result = await repo.save(ltiDeepLinkToken);

				expect(result).toEqual(ltiDeepLinkToken);
			});
		});
	});

	describe('findByState', () => {
		describe('when a state without a saved token is provided', () => {
			it('should return null', async () => {
				const result = await repo.findByState('state');

				expect(result).toBeNull();
			});
		});

		describe('when a state with a saved token is provided', () => {
			const setup = async () => {
				const ltiDeepLinkTokenEntity = ltiDeepLinkTokenEntityFactory.buildWithId();

				await em.persistAndFlush([ltiDeepLinkTokenEntity]);
				em.clear();

				const ltiDeepLinkToken = LtiDeepLinkTokenEntityMapper.mapEntityToDo(ltiDeepLinkTokenEntity);

				return {
					ltiDeepLinkToken,
				};
			};

			it('should return the latest session token domain object', async () => {
				const { ltiDeepLinkToken } = await setup();

				const result = await repo.findByState(ltiDeepLinkToken.state);

				expect(result).toEqual(ltiDeepLinkToken);
			});
		});
	});
});
