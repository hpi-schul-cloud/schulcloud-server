import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { MediaSource } from '../domain';
import { MediaSourceEntity } from '../entity';
import { mediaSourceEntityFactory, mediaSourceFactory } from '../testing';
import { MediaSourceRepo } from './media-source.repo';

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
				const mediaSource: MediaSourceEntity = mediaSourceEntityFactory.build();

				await em.persistAndFlush([mediaSource]);

				em.clear();

				return {
					mediaSource,
				};
			};

			it('should return user licenses for user', async () => {
				const { mediaSource } = await setup();

				const result = await repo.findBySourceId(mediaSource.sourceId);

				expect(result).toEqual(
					new MediaSource({
						id: mediaSource.id,
						name: mediaSource.name,
						sourceId: mediaSource.sourceId,
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
