import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { jwtPayloadFactory } from '@infra/auth-guard/testing';
import {
	FileRecordParentType,
	type FileRecordResponse,
	FilesStorageClientAdapter,
	PreviewStatus,
	StorageLocation,
} from '@infra/common-cartridge-clients';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import jwt from 'jsonwebtoken';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason } from '../type';
import { BoardImportLinkPreviewService } from './board-import-link-preview.service';
import { BoardImportServerClientService } from './board-import-server-client.service';
import { type BoardImportUserSession } from './board-import-user-session';

describe(BoardImportLinkPreviewService.name, () => {
	let module: TestingModule;
	let service: BoardImportLinkPreviewService;
	let filesStorageClient: DeepMocked<FilesStorageClientAdapter>;
	let serverClient: DeepMocked<BoardImportServerClientService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportLinkPreviewService,
				{ provide: FilesStorageClientAdapter, useValue: createMock<FilesStorageClientAdapter>() },
				{ provide: BoardImportServerClientService, useValue: createMock<BoardImportServerClientService>() },
			],
		}).compile();

		service = module.get(BoardImportLinkPreviewService);
		filesStorageClient = module.get(FilesStorageClientAdapter);
		serverClient = module.get(BoardImportServerClientService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('buildLinkContent', () => {
		const setupLink = () => {
			const payload = jwtPayloadFactory.build();
			const token = jwt.sign({ ...payload }, 'secret');
			const session = createMock<BoardImportUserSession>();
			session.call.mockImplementation((request) => request(token));
			const elementId = new ObjectId().toHexString();
			const url = 'https://example.com/page';
			const metaTags = {
				title: 'Page',
				description: 'Description',
				originalImageUrl: 'https://example.com/images/preview.png',
			};
			const fileRecordId = new ObjectId().toHexString();
			const fileRecordUrl = `/api/v3/file/download/${fileRecordId}/preview.png`;
			const fileRecord = createMock<FileRecordResponse>({
				url: fileRecordUrl,
				previewStatus: PreviewStatus.PREVIEW_POSSIBLE,
			});
			const imageUrl = `/api/v3/file/preview/${fileRecordId}/preview.png?outputFormat=image/webp`;
			const contentWithoutPreview = { url, title: '', description: '', imageUrl: '', originalImageUrl: '' };
			const contentWithoutImage = { ...metaTags, url, imageUrl: '' };

			return {
				payload,
				token,
				session,
				elementId,
				url,
				metaTags,
				fileRecordUrl,
				fileRecord,
				imageUrl,
				contentWithoutPreview,
				contentWithoutImage,
			};
		};

		const buildError = (status: HttpStatus) => {
			const error = axiosErrorFactory.build({ response: axiosResponseFactory.build({ status }) });

			return error;
		};

		describe('when the preview of the link is available', () => {
			const setup = () => {
				const data = setupLink();

				serverClient.getLinkMetaTags.mockResolvedValueOnce(data.metaTags);
				filesStorageClient.uploadFromUrl.mockResolvedValueOnce(data.fileRecord);

				return data;
			};

			it('should read the meta tags of the page with the token of the user', async () => {
				const { token, session, elementId, url } = setup();

				await service.buildLinkContent(elementId, url, session);

				expect(serverClient.getLinkMetaTags).toHaveBeenCalledWith(token, url);
			});

			it('should store the preview image as a file of the link element in the school of the user', async () => {
				const { payload, token, session, elementId, url, metaTags } = setup();

				await service.buildLinkContent(elementId, url, session);

				expect(filesStorageClient.uploadFromUrl).toHaveBeenCalledWith(
					token,
					payload.schoolId,
					StorageLocation.SCHOOL,
					elementId,
					FileRecordParentType.BOARDNODES,
					{ url: metaTags.originalImageUrl, fileName: 'preview.png', headers: expect.any(Object) }
				);
			});

			it('should return the address with the title, the description and the preview of the image', async () => {
				const { session, elementId, url, metaTags, imageUrl } = setup();

				const result = await service.buildLinkContent(elementId, url, session);

				expect(result).toEqual({ ...metaTags, url, imageUrl });
			});
		});

		describe('when the link is not a link to a page', () => {
			const setup = () => {
				const { session, elementId } = setupLink();
				const url = 'mailto:teacher@example.com';
				const expectedContent = { url, title: '', description: '', imageUrl: '', originalImageUrl: '' };

				return { session, elementId, url, expectedContent };
			};

			it('should return the address without a preview and send no request', async () => {
				const { session, elementId, url, expectedContent } = setup();

				const result = await service.buildLinkContent(elementId, url, session);

				expect(result).toEqual(expectedContent);
				expect(session.call).not.toHaveBeenCalled();
			});
		});

		describe('when the page has no image', () => {
			const setup = () => {
				const data = setupLink();
				const { title, description } = data.metaTags;
				const expectedContent = { ...data.contentWithoutPreview, title, description };

				serverClient.getLinkMetaTags.mockResolvedValueOnce({ title, description });

				return { ...data, expectedContent };
			};

			it('should return the title and the description and load no image', async () => {
				const { session, elementId, url, expectedContent } = setup();

				const result = await service.buildLinkContent(elementId, url, session);

				expect(result).toEqual(expectedContent);
				expect(filesStorageClient.uploadFromUrl).not.toHaveBeenCalled();
			});
		});

		describe('when the server cannot read the meta tags', () => {
			const setup = () => {
				const data = setupLink();

				serverClient.getLinkMetaTags.mockRejectedValueOnce(buildError(HttpStatus.INTERNAL_SERVER_ERROR));

				return data;
			};

			it('should return the address without a preview', async () => {
				const { session, elementId, url, contentWithoutPreview } = setup();

				const result = await service.buildLinkContent(elementId, url, session);

				expect(result).toEqual(contentWithoutPreview);
				expect(filesStorageClient.uploadFromUrl).not.toHaveBeenCalled();
			});
		});

		describe('when the file storage cannot load the image', () => {
			const setup = () => {
				const data = setupLink();

				serverClient.getLinkMetaTags.mockResolvedValueOnce(data.metaTags);
				filesStorageClient.uploadFromUrl.mockRejectedValueOnce(buildError(HttpStatus.UNPROCESSABLE_ENTITY));

				return data;
			};

			it('should return the preview without the image', async () => {
				const { session, elementId, url, contentWithoutImage } = setup();

				const result = await service.buildLinkContent(elementId, url, session);

				expect(result).toEqual(contentWithoutImage);
			});
		});

		describe('when the file storage has no preview of the image', () => {
			const setup = () => {
				const data = setupLink();
				const fileRecord = createMock<FileRecordResponse>({
					url: data.fileRecordUrl,
					previewStatus: PreviewStatus.AWAITING_SCAN_STATUS,
				});

				serverClient.getLinkMetaTags.mockResolvedValueOnce(data.metaTags);
				filesStorageClient.uploadFromUrl.mockResolvedValueOnce(fileRecord);

				return data;
			};

			it('should return the preview without the image', async () => {
				const { session, elementId, url, contentWithoutImage } = setup();

				const result = await service.buildLinkContent(elementId, url, session);

				expect(result).toEqual(contentWithoutImage);
			});
		});

		describe('when a request for the preview is forbidden also with a new token', () => {
			const setup = () => {
				const data = setupLink();
				const error = new BoardImportJobRejectedError(BoardImportJobLogReason.BOARD_API_FORBIDDEN);

				data.session.call.mockRejectedValueOnce(error);

				return data;
			};

			it('should return the address without a preview', async () => {
				const { session, elementId, url, contentWithoutPreview } = setup();

				const result = await service.buildLinkContent(elementId, url, session);

				expect(result).toEqual(contentWithoutPreview);
			});
		});

		describe('when the token is not valid', () => {
			const setup = () => {
				const data = setupLink();
				const error = buildError(HttpStatus.UNAUTHORIZED);

				serverClient.getLinkMetaTags.mockRejectedValueOnce(error);

				return { ...data, error };
			};

			it('should pass the error', async () => {
				const { session, elementId, url, error } = setup();

				await expect(service.buildLinkContent(elementId, url, session)).rejects.toBe(error);
			});
		});

		describe('when the job is rejected for another reason', () => {
			const setup = () => {
				const data = setupLink();
				const error = new BoardImportJobRejectedError(BoardImportJobLogReason.USER_NOT_FOUND);

				data.session.call.mockRejectedValueOnce(error);

				return { ...data, error };
			};

			it('should pass the error', async () => {
				const { session, elementId, url, error } = setup();

				await expect(service.buildLinkContent(elementId, url, session)).rejects.toBe(error);
			});
		});

		describe('when a request fails with an error that is not an answer of the API', () => {
			const setup = () => {
				const data = setupLink();
				const error = new Error('aborted');

				serverClient.getLinkMetaTags.mockRejectedValueOnce(error);

				return { ...data, error };
			};

			it('should pass the error', async () => {
				const { session, elementId, url, error } = setup();

				await expect(service.buildLinkContent(elementId, url, session)).rejects.toBe(error);
			});
		});
	});
});
