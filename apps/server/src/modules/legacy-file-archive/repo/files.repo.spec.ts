import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { StorageProviderEntity } from '@modules/school/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { OwnerType } from '../domain';
import { FileEntity } from '../entity';
import { fileEntityFactory } from '../entity/testing';
import { FilesRepo } from './files.repo';

describe(FilesRepo.name, () => {
	let repo: FilesRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [FileEntity, StorageProviderEntity],
				}),
			],
			providers: [FilesRepo],
		}).compile();

		repo = module.get(FilesRepo);
		em = module.get(EntityManager);
	});

	beforeEach(async () => {
		await em.nativeDelete(FileEntity, {});
	});

	afterAll(async () => {
		await module.close();
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});

		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(FileEntity);
		});
	});

	describe('findByIdAndOwnerType', () => {
		describe('when there are files with same owner id and different owner	 type', () => {
			it('should find files by owner id and owner type', async () => {
				const ownerId = new ObjectId().toHexString();
				const file1 = fileEntityFactory.build({ ownerId, refOwnerModel: OwnerType.User });
				const file2 = fileEntityFactory.build({ ownerId, refOwnerModel: OwnerType.User });
				const file3 = fileEntityFactory.build({ ownerId, refOwnerModel: OwnerType.Course });

				await repo.save([file1, file2, file3]);

				const foundFiles = await repo.findByIdAndOwnerType(file1.ownerId, OwnerType.User);

				expect(foundFiles).toHaveLength(2);
				expect(foundFiles).toEqual(
					expect.arrayContaining([expect.objectContaining({ id: file1.id }), expect.objectContaining({ id: file2.id })])
				);
			});
		});

		describe('when there are no files with same owner id and owner type', () => {
			it('should return empty array', async () => {
				const ownerId = new ObjectId().toHexString();
				const file1 = fileEntityFactory.build({ ownerId, refOwnerModel: OwnerType.User });
				const file2 = fileEntityFactory.build({ ownerId, refOwnerModel: OwnerType.User });
				const file3 = fileEntityFactory.build({ ownerId, refOwnerModel: OwnerType.Course });

				await repo.save([file1, file2, file3]);

				const foundFiles = await repo.findByIdAndOwnerType(file1.ownerId, OwnerType.Team);

				expect(foundFiles).toHaveLength(0);
			});
		});

		describe('when there are no files with same owner id', () => {
			it('should return empty array', async () => {
				const ownerId1 = new ObjectId().toHexString();
				const ownerId2 = new ObjectId().toHexString();

				const file1 = fileEntityFactory.build({ ownerId: ownerId1, refOwnerModel: OwnerType.User });
				const file2 = fileEntityFactory.build({ ownerId: ownerId2, refOwnerModel: OwnerType.User });
				const file3 = fileEntityFactory.build({ ownerId: ownerId2, refOwnerModel: OwnerType.Course });

				await repo.save([file1, file2, file3]);

				const foundFiles = await repo.findByIdAndOwnerType(ownerId1, OwnerType.User);

				expect(foundFiles).toHaveLength(1);
				expect(foundFiles[0].id).toBe(file1.id);
			});
		});
	});
});
