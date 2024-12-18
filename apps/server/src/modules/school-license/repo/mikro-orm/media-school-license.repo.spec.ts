import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import {
	MediaSourceEntity,
	MediaSourceBasicAuthConfigEmbeddable,
	MediaSourceOauthConfigEmbeddable,
} from '@modules/media-source/entity';
import { MediaSource } from '@modules/media-source';
import { mediaSourceEntityFactory } from '@modules/media-source/testing';
import { MediaSourceConfigMapper } from '@modules/media-source/repo';
import { MediaSchoolLicenseRepo } from './media-school-license-repo';
import { MediaSchoolLicense } from '../../domain';
import { MediaSchoolLicenseEntity } from '../../entity';
import { mediaSchoolLicenseEntityFactory, mediaSchoolLicenseFactory } from '../../testing';

describe(MediaSchoolLicenseRepo.name, () => {
	let module: TestingModule;
	let repo: MediaSchoolLicenseRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [MediaSchoolLicenseRepo],
		}).compile();

		repo = module.get(MediaSchoolLicenseRepo);
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
				const mediaSource: MediaSourceEntity = mediaSourceEntityFactory.build();
				const mediaSchoolLicenses: MediaSchoolLicenseEntity[] = mediaSchoolLicenseEntityFactory.buildList(3, {
					mediumId,
					mediaSource,
				});

				await em.persistAndFlush(mediaSchoolLicenses);
				em.clear();

				const expectedDOs: MediaSchoolLicense[] = mediaSchoolLicenses.map(
					(mediaSchoolLicense: MediaSchoolLicenseEntity): MediaSchoolLicense => {
						const mediaSource = mediaSchoolLicense.mediaSource as MediaSourceEntity;
						const domainObject = mediaSchoolLicenseFactory.build({
							id: mediaSchoolLicense.id,
							schoolId: mediaSchoolLicense.school.id,
							type: mediaSchoolLicense.type,
							mediumId: mediaSchoolLicense.mediumId,
							mediaSource: new MediaSource({
								id: mediaSource.id,
								name: mediaSource.name,
								sourceId: mediaSource.sourceId,
								format: mediaSource.format,
								basicAuthConfig: MediaSourceConfigMapper.mapBasicConfigToDo(
									mediaSource.basicAuthConfig as MediaSourceBasicAuthConfigEmbeddable
								),
								oauthConfig: MediaSourceConfigMapper.mapOauthConfigToDo(
									mediaSource.oauthConfig as MediaSourceOauthConfigEmbeddable
								),
							}),
						});

						return domainObject;
					}
				);

				return {
					mediumId,
					expectedDOs,
				};
			};

			it('should return the existing media school licenses', async () => {
				const { mediumId, expectedDOs } = await setup();

				const result = await repo.findMediaSchoolLicensesByMediumId(mediumId);

				expect(result.sort()).toEqual(expectedDOs.sort());
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
				expect(savedMediaSchoolLicense.school.id).toEqual(mediaSchoolLicense.schoolId);
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

				await em.persistAndFlush([mediaSchoolLicenseEntity]);
				em.clear();

				return { mediaSchoolLicenseDO };
			};

			it('should delete the media school license', async () => {
				const { mediaSchoolLicenseDO } = await setup();

				await repo.delete(mediaSchoolLicenseDO);

				const savedMediaSchoolLicense: MediaSchoolLicenseEntity | null = await em.findOne(MediaSchoolLicenseEntity, {});
				expect(savedMediaSchoolLicense).toBeNull();
			});
		});
	});
});
