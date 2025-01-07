import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { mediaSourceEntityFactory } from '@modules/media-source/testing';
import { MediaSchoolLicenseMikroOrmRepo } from './media-school-license.repo';
import { MediaSchoolLicense } from '../../domain';
import { MediaSchoolLicenseEntity } from '../../entity';
import { mediaSchoolLicenseEntityFactory, mediaSchoolLicenseFactory } from '../../testing';
import { MediaSchoolLicenseEntityMapper } from '../mapper/media-school-license.entity.mapper';

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

	describe('findMediaSchoolLicensesByMediumId', () => {
		describe('when a medium id of existing media school licenses is provided', () => {
			const setup = async () => {
				const mediumId = 'test-medium-id';

				const mediaSourceEntity: MediaSourceEntity = mediaSourceEntityFactory.build();
				const mediaSchoolLicenses: MediaSchoolLicenseEntity[] = mediaSchoolLicenseEntityFactory.buildList(2, {
					mediaSource: mediaSourceEntity,
					mediumId,
				});

				const otherMediaSchoolLicense: MediaSchoolLicenseEntity = mediaSchoolLicenseEntityFactory.build({
					mediaSource: mediaSourceEntityFactory.build(),
					mediumId: 'test-other-medium-id',
				});

				const licenseWithOtherMediaSource: MediaSchoolLicenseEntity = mediaSchoolLicenseEntityFactory.build({
					mediaSource: mediaSourceEntityFactory.build(),
					mediumId,
				});

				await em.persistAndFlush([otherMediaSchoolLicense, licenseWithOtherMediaSource, ...mediaSchoolLicenses]);
				em.clear();

				const expectedDOs: MediaSchoolLicense[] = mediaSchoolLicenses.map(
					(entity: MediaSchoolLicenseEntity): MediaSchoolLicense => MediaSchoolLicenseEntityMapper.mapEntityToDO(entity)
				);

				return {
					mediaSourceId: mediaSourceEntity.id,
					mediumId,
					expectedDOs,
				};
			};

			it('should return the existing media school licenses', async () => {
				const { mediaSourceId, mediumId, expectedDOs } = await setup();

				const results: MediaSchoolLicense[] = await repo.findAllByMediaSourceAndMediumId(mediaSourceId, mediumId);

				const sortedExpectedDOs = expectedDOs.sort();
				expect(results.length).toEqual(expectedDOs.length);
				results.sort().forEach((result, i) => {
					expect(result.id).toEqual(sortedExpectedDOs[i].id);
					expect(result.mediumId).toEqual(sortedExpectedDOs[i].mediumId);
					expect(result.type).toEqual(sortedExpectedDOs[i].type);
					expect(result.mediaSource).toEqual(sortedExpectedDOs[i].mediaSource);
					expect(result.school.id).toEqual(sortedExpectedDOs[i].school.id);
					expect(result.school.officialSchoolNumber).toEqual(sortedExpectedDOs[i].school.officialSchoolNumber);
				});
			});
		});
	});

	describe('save', () => {
		describe('when a media school license is provided', () => {
			const setup = () => {
				const mediaSchoolLicense = mediaSchoolLicenseFactory.build();

				return { mediaSchoolLicense };
			};

			it('should save the media school license', async () => {
				const { mediaSchoolLicense } = setup();

				await repo.save(mediaSchoolLicense);

				const savedMediaSchoolLicense: MediaSchoolLicenseEntity = await em.findOneOrFail(MediaSchoolLicenseEntity, {});
				expect(savedMediaSchoolLicense.mediumId).toEqual(mediaSchoolLicense.mediumId);
				expect(savedMediaSchoolLicense.school.id).toEqual(mediaSchoolLicense.school.id);
				expect(savedMediaSchoolLicense.mediaSource?.id).toEqual(mediaSchoolLicense.mediaSource?.id);
			});
		});
	});

	describe('delete', () => {
		describe('when an existing media school license is provided', () => {
			const setup = async () => {
				const mediaSchoolLicenseDO: MediaSchoolLicense = mediaSchoolLicenseFactory.build();
				const mediaSchoolLicenseEntity: MediaSchoolLicenseEntity = mediaSchoolLicenseEntityFactory.buildWithId(
					{},
					mediaSchoolLicenseDO.id
				);
				const otherEntity: MediaSchoolLicenseEntity = mediaSchoolLicenseEntityFactory.build();

				await em.persistAndFlush([mediaSchoolLicenseEntity, otherEntity]);
				em.clear();

				return { mediaSchoolLicenseDO };
			};

			it('should delete the media school license', async () => {
				const { mediaSchoolLicenseDO } = await setup();

				await repo.delete(mediaSchoolLicenseDO);

				const savedMediaSchoolLicense: MediaSchoolLicenseEntity | null = await em.findOne(MediaSchoolLicenseEntity, {
					id: mediaSchoolLicenseDO.id,
				});
				expect(savedMediaSchoolLicense).toBeNull();
			});
		});
	});
});
