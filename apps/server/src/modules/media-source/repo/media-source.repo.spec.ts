import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { MediaSource } from '../domain';
import { MediaSourceEntity } from '../entity';
import { MediaSourceOauthConfigEmbeddable } from '../entity/media-source-oauth-config.embeddable';
import { mediaSourceOAuthConfigEmbeddableFactory } from '../testing/media-source-oauth-config.embeddable.factory';
import { mediaSourceEntityFactory } from '../testing/media-source-entity.factory';
import { mediaSourceFactory } from '../testing/media-source.factory';
import { MediaSourceRepo } from './media-source.repo';
import { MediaSourceConfigMapper } from './media-source-config.mapper';

describe(MediaSourceRepo.name, () => {
	let module: TestingModule;
	let repo: MediaSourceRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [MediaSourceRepo],
		}).compile();

		repo = module.get(MediaSourceRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findBySourceId', () => {
		describe('when a media source exists', () => {
			const setup = async () => {
				const config: MediaSourceOauthConfigEmbeddable = mediaSourceOAuthConfigEmbeddableFactory.build();

				const mediaSource: MediaSourceEntity = mediaSourceEntityFactory.build({
					oauthConfig: config,
					basicAuthConfig: undefined,
				});

				await em.persistAndFlush([mediaSource]);

				em.clear();

				return {
					mediaSource,
					config,
				};
			};

			it('should return user licenses for user', async () => {
				const { mediaSource, config } = await setup();

				const result = await repo.findBySourceId(mediaSource.sourceId);

				expect(result).toEqual(
					new MediaSource({
						id: mediaSource.id,
						name: mediaSource.name,
						sourceId: mediaSource.sourceId,
						format: mediaSource.format,
						oauthConfig: MediaSourceConfigMapper.mapOauthConfigToDo(config),
					})
				);
			});
		});

		describe('when no media source exists', () => {
			it('should return null', async () => {
				const result = await repo.findBySourceId(new ObjectId().toHexString());

				expect(result).toBeNull();
			});
		});
	});

	describe('save', () => {
		describe('when saving a media source', () => {
			const setup = () => {
				const mediaSource: MediaSource = mediaSourceFactory.build();

				return {
					mediaSource,
				};
			};

			it('should return the media source', async () => {
				const { mediaSource } = setup();

				const result = await repo.save(mediaSource);

				expect(result).toEqual(mediaSource);
			});

			it('should save the media source', async () => {
				const { mediaSource } = setup();

				await repo.save(mediaSource);

				expect(await em.findOne(MediaSourceEntity, { id: mediaSource.id })).toBeDefined();
			});
		});
	});
});
