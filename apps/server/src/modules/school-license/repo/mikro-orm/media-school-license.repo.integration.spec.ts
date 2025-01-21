import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { mediaSourceEntityFactory } from '@modules/media-source/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { MediaSchoolLicense } from '../../domain';
import { MediaSchoolLicenseEntity } from '../../entity';
import { mediaSchoolLicenseEntityFactory, mediaSchoolLicenseFactory } from '../../testing';
import { MediaSchoolLicenseMikroOrmRepo } from './media-school-license.repo';

describe(MediaSchoolLicenseMikroOrmRepo.name, () => {
	let module: TestingModule;
	let repo: MediaSchoolLicenseMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [MediaSchoolLicenseMikroOrmRepo],
		}).compile();

		repo = module.get(MediaSchoolLicenseMikroOrmRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});
	describe('findMediaSchoolLicensesBySchoolId', () => {
		describe('when media school licenses exist', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const mediaSource: MediaSourceEntity = mediaSourceEntityFactory.build();
				const mediaSchoolLicenseEntities: MediaSchoolLicenseEntity[] = mediaSchoolLicenseEntityFactory.buildList(3, {
					school,
					mediaSource,
				});
				const otherSchoolId = new ObjectId().toHexString();

				await em.persistAndFlush([school, mediaSource, ...mediaSchoolLicenseEntities]);
				em.clear();
				return { mediaSchoolLicenseEntities, school, otherSchoolId };
			};
			it('should find all the media school licenses', async () => {
				const { mediaSchoolLicenseEntities, school } = await setup();
				const mediaSchoolLicenses: MediaSchoolLicense[] = await repo.findMediaSchoolLicensesBySchoolId(school.id);
				expect(mediaSchoolLicenses.length).toEqual(mediaSchoolLicenseEntities.length);
			});

			it('should find no media school licenses for another school', async () => {
				const { otherSchoolId } = await setup();
				const mediaSchoolLicenses: MediaSchoolLicense[] = await repo.findMediaSchoolLicensesBySchoolId(otherSchoolId);
				expect(mediaSchoolLicenses.length).toEqual(0);
			});

			it('should populate media source for found media school licenses', async () => {
				const { mediaSchoolLicenseEntities, school } = await setup();
				const mediaSchoolLicenses: MediaSchoolLicense[] = await repo.findMediaSchoolLicensesBySchoolId(school.id);
				expect(mediaSchoolLicenses[0].mediaSource?.sourceId).toContain(
					mediaSchoolLicenseEntities[0].mediaSource?.sourceId
				);
			});
		});

		describe('when media school licenses do not exist', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();

				return { schoolId };
			};
			it('should find no media school licenses', async () => {
				const { schoolId } = setup();
				const mediaSchoolLicenses: MediaSchoolLicense[] = await repo.findMediaSchoolLicensesBySchoolId(schoolId);
				expect(mediaSchoolLicenses.length).toEqual(0);
			});
		});
	});

	describe('saveAll', () => {
		describe('when media school licenses is provided', () => {
			const setup = () => {
				const mediaSchoolLicenses = mediaSchoolLicenseFactory.buildList(3);

				return { mediaSchoolLicenses };
			};

			it('should save all the media school licenses', async () => {
				const { mediaSchoolLicenses } = setup();

				await repo.saveAll(mediaSchoolLicenses);

				const savedMediaSchoolLicenses: MediaSchoolLicenseEntity[] = await em.find(MediaSchoolLicenseEntity, {});

				expect(savedMediaSchoolLicenses.length).toEqual(mediaSchoolLicenses.length);
			});

			it('should return all the saved media school licenses', async () => {
				const { mediaSchoolLicenses } = setup();

				const result = await repo.saveAll(mediaSchoolLicenses);

				expect(result.length).toEqual(mediaSchoolLicenses.length);
				expect(result.sort()).toEqual(mediaSchoolLicenses.sort());
			});
		});
	});

	describe('deleteAllByMediaSource', () => {
		describe('when a media source id is provided', () => {
			const setup = async () => {
				const mediaSource = mediaSourceEntityFactory.build();
				const mediaSchoolLicenseEntities: MediaSchoolLicenseEntity[] = mediaSchoolLicenseEntityFactory.buildList(3, {
					mediaSource,
				});

				const otherMediaSource = mediaSourceEntityFactory.build();
				const otherEntity: MediaSchoolLicenseEntity = mediaSchoolLicenseEntityFactory.build({
					mediaSource: otherMediaSource,
				});

				await em.persistAndFlush([...mediaSchoolLicenseEntities, otherEntity]);
				em.clear();

				return { mediaSource, otherEntity };
			};

			it('should delete the media school license', async () => {
				const { mediaSource, otherEntity } = await setup();

				await repo.deleteAllByMediaSource(mediaSource.id);

				const savedMediaSchoolLicenses: MediaSchoolLicenseEntity[] = await em.find(MediaSchoolLicenseEntity, {});
				expect(savedMediaSchoolLicenses.length).toEqual(1);
				expect(savedMediaSchoolLicenses[0]._id.toHexString()).toEqual(otherEntity._id.toHexString());
			});
		});
	});
});
