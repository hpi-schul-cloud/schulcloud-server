import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { FileRecordParentType } from '@modules/files-storage/entity';
import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolSpecificFileCopyServiceFactory } from './school-specific-file-copy-service.factory';
import { SchoolSpecificFileCopyServiceImpl } from './school-specific-file-copy.service';

describe('school specific file copy service factory', () => {
	let module: TestingModule;
	let factory: SchoolSpecificFileCopyServiceFactory;
	let adapter: DeepMocked<FilesStorageClientAdapterService>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				SchoolSpecificFileCopyServiceFactory,
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
			],
		}).compile();
		factory = module.get(SchoolSpecificFileCopyServiceFactory);
		adapter = module.get(FilesStorageClientAdapterService);
	});

	it('should build a school specific file copy service', () => {
		const service = factory.build({
			targetSchoolId: new ObjectId().toHexString(),
			sourceSchoolId: new ObjectId().toHexString(),
			userId: new ObjectId().toHexString(),
		});

		expect(service).toBeInstanceOf(SchoolSpecificFileCopyServiceImpl);
	});

	describe('using created service', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const sourceParentId = new ObjectId().toHexString();
			const targetParentId = new ObjectId().toHexString();
			const parentType = FileRecordParentType.BoardNode;
			const sourceSchoolId = new ObjectId().toHexString();
			const targetSchoolId = new ObjectId().toHexString();

			const service = factory.build({
				targetSchoolId,
				sourceSchoolId,
				userId,
			});

			const mockResult = [
				{ id: new ObjectId().toHexString(), sourceId: new ObjectId().toHexString(), name: 'filename' },
			];
			adapter.copyFilesOfParent.mockResolvedValue(mockResult);

			return {
				service,
				mockResult,
				userId,
				sourceParentId,
				targetParentId,
				parentType,
				sourceSchoolId,
				targetSchoolId,
			};
		};

		it('should call FilesStorageClientAdapterService with user and schoolIds', async () => {
			const { service, userId, sourceParentId, targetParentId, parentType, sourceSchoolId, targetSchoolId } = setup();

			await service.copyFilesOfParent({
				sourceParentId,
				targetParentId,
				parentType,
			});

			expect(adapter.copyFilesOfParent).toHaveBeenCalledWith({
				source: {
					parentId: sourceParentId,
					parentType,
					schoolId: sourceSchoolId,
				},
				target: {
					parentId: targetParentId,
					parentType,
					schoolId: targetSchoolId,
				},
				userId,
			});
		});

		it('should return result of adapter operation', async () => {
			const { service, sourceParentId, targetParentId, parentType, mockResult } = setup();

			const result = await service.copyFilesOfParent({
				sourceParentId,
				targetParentId,
				parentType,
			});

			expect(result).toEqual(mockResult);
		});
	});
});
