import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { tldrawFileDtoFactory } from '@shared/testing/factory';
import { TldrawFilesStorageAdapterService } from './tldraw-files-storage.service';
import { tldrawAssetFactory } from '../testing';

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
				const asset = tldrawAssetFactory.build();
				const usedAssets = [asset];

				const fileDtos = tldrawFileDtoFactory.buildListWithId(2);
				const fileWithWrongDate = tldrawFileDtoFactory.build({ createdAt: undefined });
				fileDtos.push(fileWithWrongDate);

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

			describe('when no files are older than the threshold date', () => {
				it('should not call deleteFiles on filesStorageClientAdapterService', async () => {
					const { usedAssets, listFilesOfParentSpy, deleteFilesSpy } = setup();

					await tldrawFilesStorageAdapterService.deleteUnusedFilesForDocument(
						'docname',
						usedAssets,
						new Date(2019, 1, 1, 0, 0)
					);

					expect(listFilesOfParentSpy).toHaveBeenCalled();
					expect(deleteFilesSpy).not.toHaveBeenCalled();
				});
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
