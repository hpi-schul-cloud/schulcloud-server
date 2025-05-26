import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { H5PContentParentType, H5pEditorApi, PostH5PContentCopyParams } from './generated';
import { H5pEditorClientAdapter } from './h5p-editor-client.adapter';
import { h5pCopyResponseFactory } from './testing';

describe(H5pEditorClientAdapter.name, () => {
	let module: TestingModule;
	let h5pEditorClientAdapter: H5pEditorClientAdapter;
	let h5pEditorApi: DeepMocked<H5pEditorApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5pEditorClientAdapter,
				{
					provide: H5pEditorApi,
					useValue: createMock<H5pEditorApi>(),
				},
			],
		}).compile();

		h5pEditorClientAdapter = module.get(H5pEditorClientAdapter);
		h5pEditorApi = module.get(H5pEditorApi);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('copyH5PContent', () => {
		describe('when the method is called', () => {
			const setup = () => {
				const contentId = new ObjectId().toHexString();
				const parentId = new ObjectId().toHexString();
				const parentType = H5PContentParentType.BOARD_ELEMENT;

				const copyResponse = h5pCopyResponseFactory.build();
				h5pEditorApi.h5PEditorControllerCopyH5pContent.mockResolvedValueOnce(
					axiosResponseFactory.build({ data: copyResponse })
				);

				return {
					contentId,

					parentId,
					parentType,
					newContentId: copyResponse.contentId,
				};
			};

			it('should call the h5p editor api for copying', async () => {
				const { parentId, parentType, contentId } = setup();

				await h5pEditorClientAdapter.copyH5PContent(contentId, parentId, parentType);

				const copyBodyParams: PostH5PContentCopyParams = {
					parentId,
					parentType,
				};
				expect(h5pEditorApi.h5PEditorControllerCopyH5pContent).toHaveBeenCalledWith(contentId, copyBodyParams);
			});

			it('should return the content id of the newly copied h5p content', async () => {
				const { parentId, parentType, contentId, newContentId } = setup();

				const result = await h5pEditorClientAdapter.copyH5PContent(contentId, parentId, parentType);

				expect(result).toEqual(newContentId);
			});
		});
	});
});
