import { FileRecordParentType } from '@infra/rabbitmq';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { TldrawShapeType } from '../types';
import { TldrawFilesStorageAdapterService } from './tldraw-files-storage.service';

describe('TldrawFilesStorageAdapterService', () => {
	let module: TestingModule;
	let tldrawFilesStorageAdapterService: TldrawFilesStorageAdapterService;
	let filesStorageClientAdapterService: FilesStorageClientAdapterService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TldrawFilesStorageAdapterService,
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
			],
		}).compile();

		tldrawFilesStorageAdapterService = module.get(TldrawFilesStorageAdapterService);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('deleteUnusedFilesForDocument', () => {
		describe('when there are files found for this document', () => {
			const setup = () => {
				const usedAssets = [
					{
						id: 'asset1',
						type: TldrawShapeType.Image,
						name: 'asset1.jpg',
						src: '/filerecordid1/file1.jpg',
					},
				];

				const fileDtos = [
					{ id: 'filerecordid1', parentId: 'docname', name: 'file', parentType: FileRecordParentType.BoardNode },
					{ id: 'filerecordid2', parentId: 'docname', name: 'file', parentType: FileRecordParentType.BoardNode },
					{ id: 'filerecordid3', parentId: 'docname', name: 'file', parentType: FileRecordParentType.BoardNode },
				];

				const listFilesOfParentSpy = jest
					.spyOn(filesStorageClientAdapterService, 'listFilesOfParent')
					.mockResolvedValueOnce(fileDtos);
				const deleteOneFileSpy = jest.spyOn(filesStorageClientAdapterService, 'deleteOneFile');

				return {
					usedAssets,
					listFilesOfParentSpy,
					deleteOneFileSpy,
				};
			};

			it('should call deleteOneFile on filesStorageClientAdapterService correct number of times', async () => {
				const { usedAssets, listFilesOfParentSpy, deleteOneFileSpy } = setup();

				await tldrawFilesStorageAdapterService.deleteUnusedFilesForDocument('docname', usedAssets);

				expect(listFilesOfParentSpy).toHaveBeenCalled();
				expect(deleteOneFileSpy).toHaveBeenCalledTimes(2);
			});
		});

		describe('when there are no files found for this document', () => {
			const setup = () => {
				const listFilesOfParentSpy = jest
					.spyOn(filesStorageClientAdapterService, 'listFilesOfParent')
					.mockResolvedValueOnce([]);
				const deleteOneFileSpy = jest.spyOn(filesStorageClientAdapterService, 'deleteOneFile');

				return {
					listFilesOfParentSpy,
					deleteOneFileSpy,
				};
			};

			it('should not call deleteOneFile on filesStorageClientAdapterService', async () => {
				const { listFilesOfParentSpy, deleteOneFileSpy } = setup();

				await tldrawFilesStorageAdapterService.deleteUnusedFilesForDocument('docname', []);

				expect(listFilesOfParentSpy).toHaveBeenCalled();
				expect(deleteOneFileSpy).not.toHaveBeenCalled();
			});
		});
	});
});
