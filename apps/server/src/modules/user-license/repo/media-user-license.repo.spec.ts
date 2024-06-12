import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { User as UserEntity } from '@shared/domain/entity';
import { cleanupCollections, userFactory } from '@shared/testing';
import { MediaSource, MediaUserLicense } from '../domain';
import { MediaSourceEntity, MediaUserLicenseEntity } from '../entity';
import {
	mediaSourceEntityFactory,
	mediaSourceFactory,
	mediaUserLicenseEntityFactory,
	mediaUserLicenseFactory,
} from '../testing';
import { MediaUserLicenseRepo } from './media-user-license.repo';

describe(MediaUserLicenseRepo.name, () => {
	let module: TestingModule;
	let repo: MediaUserLicenseRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
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
				const user: UserEntity = userFactory.build();
				const mediaSource: MediaSourceEntity = mediaSourceEntityFactory.build();
				const mediaUserLicense: MediaUserLicenseEntity = mediaUserLicenseEntityFactory.build({ user, mediaSource });
				const otherMediaUserLicense: MediaUserLicenseEntity = mediaUserLicenseEntityFactory.build();

				await em.persistAndFlush([user, mediaUserLicense, otherMediaUserLicense]);

				em.clear();

				return {
					user,
					mediaUserLicense,
					mediaSource,
				};
			};

			it('should return user licenses for user', async () => {
				const { user, mediaUserLicense, mediaSource } = await setup();

				const result: MediaUserLicense[] = await repo.findMediaUserLicensesForUser(user.id);

				expect(result).toEqual([
					new MediaUserLicense({
						id: mediaUserLicense.id,
						type: mediaUserLicense.type,
						userId: mediaUserLicense.user.id,
						mediumId: mediaUserLicense.mediumId,
						mediaSource: new MediaSource({
							id: mediaSource.id,
							name: mediaSource.name,
							sourceId: mediaSource.sourceId,
						}),
					}),
				]);
			});
		});
	});

	describe('save', () => {
		describe('when saving a media user license', () => {
			const setup = () => {
				const mediaSource: MediaSource = mediaSourceFactory.build();
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

			it('should save the media user license with its media source', async () => {
				const { mediaUserLicense, mediaSource } = setup();

				await repo.save(mediaUserLicense);

				expect(await em.findOne(MediaUserLicenseEntity, { id: mediaUserLicense.id })).toBeDefined();
				expect(await em.findOne(MediaSourceEntity, { id: mediaSource.id })).toBeDefined();
			});
		});
	});
});
