import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { FileRecordParentType, FilesStorageClientAdapter, StorageLocation } from '@infra/files-storage-client';
import { fileRecordResponseFactory } from '@infra/files-storage-client/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { InstanceService } from '@modules/instance';
import { instanceFactory } from '@modules/instance/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { FileRecordRef } from '../domain';
import { ExternalToolImageService } from './external-tool-image.service';

describe(ExternalToolImageService.name, () => {
	let module: TestingModule;
	let service: ExternalToolImageService;

	let filesStorageClient: DeepMocked<FilesStorageClientAdapter>;
	let instanceService: DeepMocked<InstanceService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolImageService,
				{
					provide: FilesStorageClientAdapter,
					useValue: createMock<FilesStorageClientAdapter>(),
				},
				{
					provide: InstanceService,
					useValue: createMock<InstanceService>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolImageService);
		filesStorageClient = module.get(FilesStorageClientAdapter);
		instanceService = module.get(InstanceService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('uploadImageFileFromUrl', () => {
		const setup = () => {
			const fileRecordId = new ObjectId().toHexString();
			const externalToolId = new ObjectId().toHexString();
			const fileNameAffix = 'fileNameAffix';

			const instance = instanceFactory.build();
			instanceService.getInstance.mockResolvedValueOnce(instance);

			const fileRecordResponse = fileRecordResponseFactory.build();

			filesStorageClient.uploadFromUrl.mockResolvedValueOnce(fileRecordResponse);

			return {
				fileRecordId,
				externalToolId,
				fileNameAffix,
				instance,
				fileRecordResponse,
			};
		};

		it('should call InstanceService', async () => {
			const { externalToolId, fileNameAffix } = setup();

			await service.uploadImageFileFromUrl('url', fileNameAffix, externalToolId);

			expect(instanceService.getInstance).toHaveBeenCalled();
		});

		it('should call file api', async () => {
			const { externalToolId, fileNameAffix, instance } = setup();

			await service.uploadImageFileFromUrl('url', fileNameAffix, externalToolId);

			expect(filesStorageClient.uploadFromUrl).toHaveBeenCalledWith(
				instance.id,
				StorageLocation.INSTANCE,
				externalToolId,
				FileRecordParentType.EXTERNALTOOLS,
				{
					url: 'url',
					fileName: `external-tool-${fileNameAffix}-${externalToolId}`,
				}
			);
		});

		it('should return FileRecordRef', async () => {
			const { externalToolId, fileNameAffix, fileRecordResponse } = setup();

			const result: FileRecordRef = await service.uploadImageFileFromUrl('url', fileNameAffix, externalToolId);

			expect(result).toEqual(
				expect.objectContaining({
					uploadUrl: 'url',
					fileName: `external-tool-${fileNameAffix}-${externalToolId}`,
					fileRecordId: fileRecordResponse.id,
				})
			);
		});
	});

	describe('deleteImageFile', () => {
		const setup = () => {
			const fileRecordId = new ObjectId().toHexString();

			const fileRecordResponse = fileRecordResponseFactory.build({ id: fileRecordId });

			filesStorageClient.deleteFile.mockResolvedValueOnce(fileRecordResponse);

			return {
				fileRecordId,
			};
		};

		it('should call file api', async () => {
			const { fileRecordId } = setup();

			await service.deleteImageFile(fileRecordId);

			expect(filesStorageClient.deleteFile).toHaveBeenCalledWith(fileRecordId);
		});
	});

	describe('deleteAllFiles', () => {
		const setup = () => {
			const fileRecordId = new ObjectId().toHexString();

			const fileRecordResponse = fileRecordResponseFactory.build({ id: fileRecordId });
			filesStorageClient.deleteByParent.mockResolvedValueOnce({
				data: [fileRecordResponse],
				total: 1,
				skip: 0,
				limit: 1,
			});
			const instance = instanceFactory.build();
			instanceService.getInstance.mockResolvedValueOnce(instance);

			return {
				fileRecordId,
				instance,
			};
		};

		it('should call file api', async () => {
			const { fileRecordId, instance } = setup();

			await service.deleteAllFiles(fileRecordId);

			expect(filesStorageClient.deleteByParent).toHaveBeenCalledWith(
				instance.id,
				StorageLocation.INSTANCE,
				fileRecordId,
				FileRecordParentType.EXTERNALTOOLS
			);
		});
	});
});
