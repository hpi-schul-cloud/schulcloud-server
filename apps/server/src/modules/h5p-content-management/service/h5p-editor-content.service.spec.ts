import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { H5pEditorContentInvalidIdLoggableException } from '../loggable';
import { H5PContentRepo } from '../repo';
import { h5pContentFactory, h5pCopyContentParamsFactory } from '../testing';
import { ContentStorage } from './content-storage.service';
import { H5pEditorContentService } from './h5p-editor-content.service';

describe(H5pEditorContentService.name, () => {
	let module: TestingModule;
	let service: H5pEditorContentService;

	let h5PContentRepo: DeepMocked<H5PContentRepo>;
	let contentStorage: DeepMocked<ContentStorage>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5pEditorContentService,
				{
					provide: H5PContentRepo,
					useValue: createMock<H5PContentRepo>(),
				},
				{
					provide: ContentStorage,
					useValue: createMock<ContentStorage>(),
				},
			],
		}).compile();

		service = module.get(H5pEditorContentService);
		h5PContentRepo = module.get(H5PContentRepo);
		contentStorage = module.get(ContentStorage);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		jest.setSystemTime(new Date('01-01-2020'));
	});

	afterAll(async () => {
		await module.close();
	});

	describe('copyH5pContent', () => {
		describe('when the copy params are passed', () => {
			const setup = () => {
				const sourceContent = h5pContentFactory.build();
				const params = h5pCopyContentParamsFactory.build();

				const copiedContent = h5pContentFactory.buildWithId(
					{
						...sourceContent,
						...params,
					},
					params.copiedContentId
				);

				h5PContentRepo.findById.mockResolvedValueOnce(sourceContent);

				return { params, copiedContent };
			};

			it('should save the h5p content', async () => {
				const { params, copiedContent } = setup();

				await service.copyH5pContent(params);

				expect(h5PContentRepo.save).toHaveBeenCalledWith(copiedContent);
			});

			it('should copy the files of the h5p content', async () => {
				const { params } = setup();

				await service.copyH5pContent(params);

				expect(contentStorage.copyAllFiles).toHaveBeenCalledWith(params.sourceContentId, params.copiedContentId);
			});
		});

		describe('when the files of the h5p content fail to be copied', () => {
			const setup = () => {
				const sourceContent = h5pContentFactory.build();
				const params = h5pCopyContentParamsFactory.build();

				const copiedContent = h5pContentFactory.buildWithId(
					{
						...sourceContent,
						...params,
					},
					params.copiedContentId
				);

				const error = new InternalServerErrorException();

				h5PContentRepo.findById.mockResolvedValueOnce(sourceContent);
				contentStorage.copyAllFiles.mockRejectedValueOnce(error);

				return { params, copiedContent, error };
			};

			it('should throw the error', async () => {
				const { params, error } = setup();

				const promise = service.copyH5pContent(params);

				await expect(promise).rejects.toThrow(error);
			});

			it('should remove the previously saved h5p content', async () => {
				const { params, copiedContent } = setup();

				const promise = service.copyH5pContent(params);

				await expect(promise).rejects.toThrow();
				expect(h5PContentRepo.deleteContent).toHaveBeenCalledWith(copiedContent);
			});
		});

		describe('when the copied content id in the params is an invalid mongo id', () => {
			it('should throw an H5pEditorContentInvalidIdLoggableException', async () => {
				const params = h5pCopyContentParamsFactory.build({ copiedContentId: 'abc' });

				const promise = service.copyH5pContent(params);

				await expect(promise).rejects.toThrow(new H5pEditorContentInvalidIdLoggableException(params.copiedContentId));
			});
		});
	});
});
