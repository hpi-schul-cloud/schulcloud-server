import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { MediaSource } from '../do';
import { MediaSourceEntity } from '../entity';
import { MediaSourceDataFormat } from '../enum';
import { mediaSourceEntityFactory, mediaSourceFactory } from '../testing';
import { MediaSourceMapper } from './media-source.mapper';
import { MediaSourceRepo } from './media-source.repo';

describe(MediaSourceRepo.name, () => {
	let module: TestingModule;
	let repo: MediaSourceRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [MediaSourceEntity] })],
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

	describe('findByFormat', () => {
		describe('when a media source data format is provided', () => {
			describe('when there the media source exists', () => {
				const setup = async () => {
					const vidisMediaSourceEntity = mediaSourceEntityFactory.withVidisFormat().build();
					const biloMediaSourceEntity = mediaSourceEntityFactory.withBiloFormat().build();

					await em.persistAndFlush([vidisMediaSourceEntity, biloMediaSourceEntity]);
					em.clear();

					const expectedDO = MediaSourceMapper.mapEntityToDo(vidisMediaSourceEntity);

					return { expectedDO };
				};

				it('should return the media source', async () => {
					const { expectedDO } = await setup();

					const result: MediaSource | null = await repo.findByFormat(MediaSourceDataFormat.VIDIS);

					expect(result).toEqual(expectedDO);
				});
			});

			describe('when there the media source does not exist', () => {
				it('should return null', async () => {
					const format = MediaSourceDataFormat.VIDIS;

					const result: MediaSource | null = await repo.findByFormat(format);

					expect(result).toBeNull();
				});
			});
		});
	});

	describe('findByFormatAndSourceId', () => {
		describe('when a media source data format and source id is provided', () => {
			describe('when the media source exists', () => {
				const setup = async () => {
					const format = MediaSourceDataFormat.VIDIS;

					const vidisMediaSourceEntity = mediaSourceEntityFactory.withVidisFormat().build();
					const biloMediaSourceEntity = mediaSourceEntityFactory.withBiloFormat().build();

					await em.persistAndFlush([vidisMediaSourceEntity, biloMediaSourceEntity]);

					em.clear();

					const expectedDO = MediaSourceMapper.mapEntityToDo(vidisMediaSourceEntity);

					return { format, vidisMediaSourceEntity, expectedDO };
				};

				it('should return the media source', async () => {
					const { format, vidisMediaSourceEntity, expectedDO } = await setup();

					const result: MediaSource | null = await repo.findByFormatAndSourceId(
						format,
						vidisMediaSourceEntity.sourceId
					);

					expect(result).toEqual(expectedDO);
				});
			});

			describe('when the media source does not exist', () => {
				it('should return null', async () => {
					const format = MediaSourceDataFormat.VIDIS;
					const sourceId = 'source-id';

					const result: MediaSource | null = await repo.findByFormatAndSourceId(format, sourceId);

					expect(result).toBeNull();
				});
			});
		});
	});
});
