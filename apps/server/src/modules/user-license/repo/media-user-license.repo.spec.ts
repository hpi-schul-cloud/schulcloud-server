import { EntityManager } from '@mikro-orm/mongodb';
import { MediaSource } from '@modules/media-source';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { MediaSourceConfigMapper } from '@modules/media-source/repo';
import {
	mediaSourceEntityFactory,
	mediaSourceFactory,
	mediaSourceOAuthConfigEmbeddableFactory,
	mediaSourceVidisConfigEmbeddableFactory,
} from '@modules/media-source/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { MediaUserLicense } from '../domain';
import { MediaUserLicenseEntity, UserLicenseEntity } from '../entity';
import { mediaUserLicenseEntityFactory, mediaUserLicenseFactory } from '../testing';
import { MediaUserLicenseRepo } from './media-user-license.repo';

describe(MediaUserLicenseRepo.name, () => {
	let module: TestingModule;
	let repo: MediaUserLicenseRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [MediaUserLicenseEntity, UserLicenseEntity, MediaSourceEntity, User],
				}),
			],
			providers: [MediaUserLicenseRepo],
		}).compile();

		repo = module.get(MediaUserLicenseRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findMediaUserLicensesForUser', () => {
		describe('when searching for a users media licences', () => {
			const setup = async () => {
				const user = userFactory.build();
				const otherUser = userFactory.build();
				const vidisConfig = mediaSourceVidisConfigEmbeddableFactory.build();
				const oauthConfig = mediaSourceOAuthConfigEmbeddableFactory.build();
				const vidisMediaSourceEntity = mediaSourceEntityFactory.withVidisFormat(vidisConfig).build();
				const biloMediaSourceEntity = mediaSourceEntityFactory.withBiloFormat(oauthConfig).build();
				const mediaUserLicense: MediaUserLicenseEntity = mediaUserLicenseEntityFactory.build({
					user,
					mediaSource: vidisMediaSourceEntity,
				});
				const otherMediaUserLicense: MediaUserLicenseEntity = mediaUserLicenseEntityFactory.build({
					user: otherUser,
					mediaSource: biloMediaSourceEntity,
				});

				await em.persistAndFlush([user, otherUser, mediaUserLicense, otherMediaUserLicense]);

				em.clear();

				return {
					user,
					otherUser,
					mediaUserLicense,
					otherMediaUserLicense,
					vidisMediaSourceEntity,
					biloMediaSourceEntity,
					vidisConfig,
					oauthConfig,
				};
			};

			it('should return bilo user licenses for user', async () => {
				const { otherUser, otherMediaUserLicense, biloMediaSourceEntity, oauthConfig } = await setup();

				const result: MediaUserLicense[] = await repo.findMediaUserLicensesForUser(otherUser.id);

				expect(result).toEqual([
					new MediaUserLicense({
						id: otherMediaUserLicense.id,
						type: otherMediaUserLicense.type,
						userId: otherMediaUserLicense.user.id,
						mediumId: otherMediaUserLicense.mediumId,
						mediaSource: new MediaSource({
							id: biloMediaSourceEntity.id,
							name: biloMediaSourceEntity.name,
							sourceId: biloMediaSourceEntity.sourceId,
							format: biloMediaSourceEntity.format,
							oauthConfig: MediaSourceConfigMapper.mapOauthConfigToDo(oauthConfig),
						}),
					}),
				]);
			});

			it('should return vidis user licenses for user', async () => {
				const { user, mediaUserLicense, vidisMediaSourceEntity, vidisConfig } = await setup();

				const result: MediaUserLicense[] = await repo.findMediaUserLicensesForUser(user.id);

				expect(result).toEqual([
					new MediaUserLicense({
						id: mediaUserLicense.id,
						type: mediaUserLicense.type,
						userId: mediaUserLicense.user.id,
						mediumId: mediaUserLicense.mediumId,
						mediaSource: new MediaSource({
							id: vidisMediaSourceEntity.id,
							name: vidisMediaSourceEntity.name,
							sourceId: vidisMediaSourceEntity.sourceId,
							format: vidisMediaSourceEntity.format,
							vidisConfig: MediaSourceConfigMapper.mapVidisConfigToDo(vidisConfig),
						}),
					}),
				]);
			});
		});
	});

	describe('save', () => {
		describe('when saving a media user license', () => {
			const setup = () => {
				const mediaSource: MediaSource = mediaSourceFactory.withBildungslogin().build();
				const mediaUserLicense: MediaUserLicense = mediaUserLicenseFactory.build({ mediaSource });

				return {
					mediaUserLicense,
					mediaSource,
				};
			};

			it('should return the media user license', async () => {
				const { mediaUserLicense } = setup();

				const result = await repo.save(mediaUserLicense);

				expect(result).toEqual(mediaUserLicense);
			});

			it('should save the media user license', async () => {
				const { mediaUserLicense } = setup();

				await repo.save(mediaUserLicense);

				expect(await em.findOne(MediaUserLicenseEntity, { id: mediaUserLicense.id })).not.toBeNull();
			});
		});
	});
});
