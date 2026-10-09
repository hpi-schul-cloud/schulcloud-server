import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntity } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { MediaSource } from '@modules/media-source';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { MediaSourceConfigMapper } from '@modules/media-source/repo';
import {
	mediaSourceEntityFactory,
	mediaSourceFactory,
	mediaSourceVidisConfigEmbeddableFactory,
} from '@modules/media-source/testing';
import { SchoolEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/repo';
import { User } from '@modules/user/repo';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { MediaGroupLicense } from '../domain';
import { GroupLicenseEntity, MediaGroupLicenseEntity } from '../entity';
import { mediaGroupLicenseEntityFactory, mediaGroupLicenseFactory } from '../testing';
import { MediaGroupLicenseMikroOrmRepo } from './mikro-orm/media-group-license.repo';

describe(MediaGroupLicenseMikroOrmRepo.name, () => {
	let module: TestingModule;
	let repo: MediaGroupLicenseMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [
						MediaGroupLicenseEntity,
						GroupLicenseEntity,
						MediaSourceEntity,
						GroupEntity,
						User,
						SchoolEntity,
						SystemEntity,
					],
				}),
			],
			providers: [MediaGroupLicenseMikroOrmRepo],
		}).compile();

		repo = module.get(MediaGroupLicenseMikroOrmRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findMediaGroupLicensesByGroupIds', () => {
		it('should return licenses for matching groups', async () => {
			const group1 = groupEntityFactory.build();
			const group2 = groupEntityFactory.build();
			const vidisConfig = mediaSourceVidisConfigEmbeddableFactory.build();
			const mediaSourceEntity = mediaSourceEntityFactory.withVidisFormat(vidisConfig).build();
			const license1 = mediaGroupLicenseEntityFactory.build({
				group: group1,
				mediaSource: mediaSourceEntity,
			});
			const license2 = mediaGroupLicenseEntityFactory.build({
				group: group2,
				mediaSource: mediaSourceEntity,
			});

			await em.persist([group1, group2, license1, license2]).flush();
			em.clear();

			const result = await repo.findMediaGroupLicensesByGroupIds([group1.id]);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(
				new MediaGroupLicense({
					id: license1.id,
					type: license1.type,
					groupId: group1.id,
					mediumId: license1.mediumId,
					mediaSource: new MediaSource({
						id: mediaSourceEntity.id,
						name: mediaSourceEntity.name,
						sourceId: mediaSourceEntity.sourceId,
						format: mediaSourceEntity.format,
						vidisConfig: MediaSourceConfigMapper.mapVidisConfigToDo(vidisConfig),
					}),
				})
			);
		});

		it('should return an empty array when groupIds is empty', async () => {
			const result = await repo.findMediaGroupLicensesByGroupIds([]);

			expect(result).toEqual([]);
		});
	});

	describe('findMediaGroupLicensesByGroupId', () => {
		it('should return licenses for the given group', async () => {
			const group = groupEntityFactory.build();
			const license = mediaGroupLicenseEntityFactory.build({ group });

			await em.persist([group, license]).flush();
			em.clear();

			const result = await repo.findMediaGroupLicensesByGroupId(group.id);

			expect(result).toHaveLength(1);
			expect(result[0].groupId).toBe(group.id);
		});
	});

	describe('saveAll', () => {
		it('should save media group licenses', async () => {
			const group = groupEntityFactory.build();
			await em.persist(group).flush();
			em.clear();

			const mediaSource = mediaSourceFactory.withBildungslogin().build();
			const license = mediaGroupLicenseFactory.build({ groupId: group.id, mediaSource });

			const result = await repo.saveAll([license]);

			expect(result).toHaveLength(1);
			expect(await em.findOne(MediaGroupLicenseEntity, { id: license.id })).not.toBeNull();
		});
	});
});
