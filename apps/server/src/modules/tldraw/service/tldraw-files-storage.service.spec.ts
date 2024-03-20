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
					{
						id: 'filerecordid1',
						parentId: 'docname',
						name: 'file',
						parentType: FileRecordParentType.BoardNode,
						createdAt: new Date(2020, 1, 1, 0, 0),
					},
					{
						id: 'filerecordid2',
						parentId: 'docname',
						name: 'file',
						parentType: FileRecordParentType.BoardNode,
						createdAt: new Date(2020, 1, 1, 0, 0),
					},
					{
						id: 'filerecordid3',
						parentId: 'docname',
						name: 'file',
						parentType: FileRecordParentType.BoardNode,
					},
				];

				const listFilesOfParentSpy = jest
					.spyOn(filesStorageClientAdapterService, 'listFilesOfParent')
					.mockResolvedValueOnce(fileDtos);
				const deleteFilesSpy = jest.spyOn(filesStorageClientAdapterService, 'deleteFiles');

				return {
					usedAssets,
					listFilesOfParentSpy,
					deleteFilesSpy,
				};
			};

			it('should call deleteFiles on filesStorageClientAdapterService', async () => {
				const { usedAssets, listFilesOfParentSpy, deleteFilesSpy } = setup();

				await tldrawFilesStorageAdapterService.deleteUnusedFilesForDocument('docname', usedAssets, new Date());

				expect(listFilesOfParentSpy).toHaveBeenCalled();
				expect(deleteFilesSpy).toHaveBeenCalled();
			});
		});

		describe('when there are no files found for this document', () => {
			const setup = () => {
				const listFilesOfParentSpy = jest
					.spyOn(filesStorageClientAdapterService, 'listFilesOfParent')
					.mockResolvedValueOnce([]);
				const deleteFilesSpy = jest.spyOn(filesStorageClientAdapterService, 'deleteFiles');

				return {
					listFilesOfParentSpy,
					deleteFilesSpy,
				};
			};

			it('should not call deleteFiles on filesStorageClientAdapterService', async () => {
				const { listFilesOfParentSpy, deleteFilesSpy } = setup();

				await tldrawFilesStorageAdapterService.deleteUnusedFilesForDocument('docname', [], new Date());

				expect(listFilesOfParentSpy).toHaveBeenCalled();
				expect(deleteFilesSpy).not.toHaveBeenCalled();
			});
		});
	});
});
