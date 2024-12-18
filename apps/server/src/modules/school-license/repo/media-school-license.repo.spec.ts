import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity } from '@shared/domain/entity';
import { cleanupCollections, schoolEntityFactory } from '@shared/testing';
import {
	MediaSourceEntity,
	MediaSourceBasicAuthConfigEmbeddable,
	MediaSourceOauthConfigEmbeddable,
} from '@src/modules/media-source/entity';
import { MediaSource } from '@src/modules/media-source/domain';
import { MediaSourceConfigMapper } from '@src/modules/media-source/repo';
import { mediaSourceEntityFactory } from '@src/modules/media-source/testing/media-source-entity.factory';
import { MediaSchoolLicenseRepo } from './media-school-license-repo';
import { MediaSchoolLicenseEntity } from '../entity/media-school-license.entity';
import { mediaSchoolLicenseEntityFactory } from '../testing';

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

	// TODO: incomplete
	describe('findMediaSchoolLicense', () => {
		describe('when searching for media licences', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.build();
				const mediaSource: MediaSourceEntity = mediaSourceEntityFactory.build();
				const mediaSchoolLicense: MediaSchoolLicenseEntity = mediaSchoolLicenseEntityFactory.build({
					school,
					mediaSource,
				});

				await em.persistAndFlush([school, mediaSchoolLicense]);

				em.clear();

				return {
					school,
					mediaSchoolLicense,
					mediaSource,
				};
			};

			it('should return licenses for user', async () => {
				const { school, mediaSchoolLicense, mediaSource } = await setup();

				const result = await repo.findMediaSchoolLicense(school.id, mediaSchoolLicense.mediumId);

				expect(result).toEqual(
					expect.objectContaining({
						id: mediaSchoolLicense.id,
						schoolId: school.id,
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
					})
				);
			});
		});
	});
});
