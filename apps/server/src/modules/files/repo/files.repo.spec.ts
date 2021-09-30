import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { BaseFile, File, Directory, StorageProvider } from '@shared/domain';
import { FilesRepo } from './files.repo';

interface FileData {
	isDirectory?: false;
	storageFileName?: string;
	bucket?: string;
	deletedAt?: Date;
}

describe('FilesRepo', () => {
	let repo: FilesRepo;
	let em: EntityManager;
	let module: TestingModule;

	const createTestFile = async ({
		isDirectory = false,
		storageFileName = 'storageFileName',
		bucket = 'test-bucket',
		deletedAt = undefined,
	}: FileData = {}): Promise<File> => {
		const file = em.create(File, {
			isDirectory,
			storageFileName,
			bucket,
			deletedAt,
			storageProvider: new ObjectId().toHexString(),
		});
		await em.persistAndFlush(file);
		return file;
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [FilesRepo],
		}).compile();

		repo = module.get(FilesRepo);
		em = module.get(EntityManager);
	});

	beforeEach(async () => {
		await em.nativeDelete(BaseFile, {});
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
	});

	describe('getExpiredFiles', () => {
		beforeEach(async () => {
			await em.nativeDelete(File, {});
		});

		it('should return expired file', async () => {
			const expiredDate = new Date();
			const file = await createTestFile({ deletedAt: expiredDate });
			const backupPeriodThreshold = new Date();

			const result = await repo.getExpiredFiles(backupPeriodThreshold);
			expect(result.length).toEqual(1);
			expect(result[0]).toEqual(file);
		});

		it('should not return files, which are not deleted', async () => {
			await createTestFile({ deletedAt: undefined });
			const backupPeriodThreshold = new Date();

			const result = await repo.getExpiredFiles(backupPeriodThreshold);
			expect(result.length).toEqual(0);
		});

		it('should not return files, which are deleted too recently', async () => {
			const backupPeriodThreshold = new Date();
			await createTestFile({ deletedAt: new Date() });

			const result = await repo.getExpiredFiles(backupPeriodThreshold);
			expect(result.length).toEqual(0);
		});
	});

	describe('deleteFile', () => {
		it('should delete the given file', async () => {
			const file = await createTestFile();

			await repo.deleteFile(file);

			const searchedFile = await em.findOne(File, file._id);
			expect(searchedFile).toBeNull;
		});
	});
});
