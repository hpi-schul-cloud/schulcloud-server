import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User as UserEntity } from '@shared/domain/entity';
import { cleanupCollections, userFactory } from '@shared/testing';
import { MediaSource, MediaUserLicense } from '../domain';
import { MediaUserLicenseEntity, UserLicenseEntity, UserLicenseType } from '../entity';
import { mediaUserLicenseEntityFactory, mediaUserLicenseFactory } from '../testing';
import { UserLicenseRepo } from './user-license.repo';

describe(UserLicenseRepo.name, () => {
	let module: TestingModule;
	let repo: UserLicenseRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [UserLicenseRepo],
		}).compile();

		repo = module.get(UserLicenseRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findUserLicenses', () => {
		describe('when query is empty', () => {
			const setup = async () => {
				const user: UserEntity = userFactory.build();
				const mediaUserLicense: MediaUserLicenseEntity = mediaUserLicenseEntityFactory.build({
					user,
				});

				await em.persistAndFlush([user, mediaUserLicense]);
				em.clear();

				return {
					user,
					mediaUserLicense,
				};
			};

			it('should return all user licenses', async () => {
				const { mediaUserLicense } = await setup();

				const result: MediaUserLicense[] = await repo.findMediaUserLicenses({});

				expect(result).toEqual([
					new MediaUserLicense({
						id: mediaUserLicense.id,
						userId: mediaUserLicense.user.id,
						mediumId: mediaUserLicense.mediumId,
						mediaSource: new MediaSource({
							id: mediaUserLicense.mediaSource?.id as string,
							name: mediaUserLicense.mediaSource?.name,
							sourceId: mediaUserLicense.mediaSource?.sourceId as string,
						}),
						type: mediaUserLicense.type,
					}),
				]);
			});
		});

		describe('when query has userId', () => {
			const setup = async () => {
				const user: UserEntity = userFactory.build();
				const mediaUserLicense: MediaUserLicenseEntity = mediaUserLicenseEntityFactory.build({ user });
				const otherMediaUserLicense: MediaUserLicenseEntity = mediaUserLicenseEntityFactory.build();

				await em.persistAndFlush([user, mediaUserLicense, otherMediaUserLicense]);

				em.clear();

				return {
					user,
				};
			};

			it('should return user licenses for user', async () => {
				const { user } = await setup();

				const result: MediaUserLicense[] = await repo.findMediaUserLicenses({ userId: user.id });

				expect(result).toEqual([
					expect.objectContaining<Partial<MediaUserLicense>>({
						userId: user.id,
					}),
				]);
			});
		});

		describe('when query has type', () => {
			const setup = async () => {
				const user: UserEntity = userFactory.build();
				const mediaUserLicense: MediaUserLicenseEntity = mediaUserLicenseEntityFactory.build({ user });

				await em.persistAndFlush([user, mediaUserLicense]);

				em.clear();

				return {
					user,
				};
			};

			it('should return user licenses for type', async () => {
				await setup();

				const result: MediaUserLicense[] = await repo.findMediaUserLicenses({});

				expect(result).toEqual([
					expect.objectContaining<Partial<MediaUserLicense>>({
						type: UserLicenseType.MEDIA_LICENSE,
					}),
				]);
			});
		});

		describe('when entity type is unknown', () => {
			const setup = async () => {
				const unknownEntity: UserLicenseEntity = mediaUserLicenseEntityFactory.build();
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				unknownEntity.type = 'shouldNeverHappen';

				await em.persistAndFlush([unknownEntity]);
			};

			it('should throw InternalServerErrorException', async () => {
				await setup();

				await expect(repo.findMediaUserLicenses({})).rejects.toThrow(InternalServerErrorException);
			});
		});
	});

	describe('deleteUserLicense', () => {
		const setup = async () => {
			const mediaUserLicenseEntity: MediaUserLicenseEntity = mediaUserLicenseEntityFactory.build();
			const mediaUserLicense: MediaUserLicense = mediaUserLicenseFactory.build({ id: mediaUserLicenseEntity.id });

			await em.persistAndFlush(mediaUserLicenseEntity);

			return { mediaUserLicense };
		};

		it('should not find deleted user license', async () => {
			const { mediaUserLicense } = await setup();

			await repo.deleteUserLicense(mediaUserLicense);

			expect(await em.findOne(MediaUserLicenseEntity, { id: mediaUserLicense.id })).toBeNull();
		});
	});

	describe('saveUserLicense', () => {
		const setup = () => {
			const mediaUserLicense: MediaUserLicense = mediaUserLicenseFactory.build();

			return { mediaUserLicense };
		};

		it('should find saved user license', async () => {
			const { mediaUserLicense } = setup();

			await repo.saveUserLicense(mediaUserLicense);

			expect(await em.findOne(MediaUserLicenseEntity, { id: mediaUserLicense.id })).toBeDefined();
		});
	});
});
