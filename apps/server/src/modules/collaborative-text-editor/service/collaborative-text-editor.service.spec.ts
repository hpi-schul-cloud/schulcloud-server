import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EtherpadClientAdapter } from '@infra/etherpad-client';
import { Test, TestingModule } from '@nestjs/testing';
import { CollaborativeTextEditorParentType } from '../api/dto/get-collaborative-text-editor-for-parent.params';
import { COLLABORATIVE_TEXT_EDITOR_CONFIG_TOKEN } from '../collaborative-text-editor.config';
import { CollaborativeTextEditorService } from './collaborative-text-editor.service';

describe('CollaborativeTextEditorService', () => {
	let service: CollaborativeTextEditorService;
	let etherpadClientAdapter: DeepMocked<EtherpadClientAdapter>;
	const COOKIE_EXPIRES_SECONDS = 2;
	const COOKIE_RELEASE_THRESHOLD = 5;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CollaborativeTextEditorService,
				{
					provide: EtherpadClientAdapter,
					useValue: createMock<EtherpadClientAdapter>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: COLLABORATIVE_TEXT_EDITOR_CONFIG_TOKEN,
					useValue: {
						padUri: 'http://localhost:9001/p',
						cookieExpiresInSeconds: COOKIE_EXPIRES_SECONDS,
						cookieReleaseThreshold: COOKIE_RELEASE_THRESHOLD,
					},
				},
			],
		}).compile();

		service = module.get(CollaborativeTextEditorService);
		etherpadClientAdapter = module.get(EtherpadClientAdapter);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createCollaborativeTextEditor', () => {
		const buildParameter = () => {
			const userId = 'userId';
			const userName = 'userName';
			const parentId = 'parentId';
			const params = { parentId, parentType: CollaborativeTextEditorParentType.BOARD_CONTENT_ELEMENT };
			const groupId = 'groupId';
			const padId = 'padId';
			const authorId = 'authorId';
			const sessionId = 'sessionId1';
			const authorsSessionIds = ['sessionId1', 'sessionId2'];
			const url = 'http://localhost:9001/p';
			const dateMock = new Date(2022, 1, 22);
			const sessionExpiryDate = new Date(dateMock.getTime() + COOKIE_EXPIRES_SECONDS * 1000);

			return {
				userId,
				userName,
				params,
				groupId,
				padId,
				authorId,
				sessionId,
				authorsSessionIds,
				url,
				sessionExpiryDate,
				dateMock,
			};
		};

		describe('WHEN all adapter requests return successfully', () => {
			const setup = () => {
				const {
					userId,
					userName,
					params,
					groupId,
					padId,
					authorId,
					sessionId,
					authorsSessionIds,
					url,
					sessionExpiryDate,
					dateMock,
				} = buildParameter();

				etherpadClientAdapter.getOrCreateGroupId.mockResolvedValueOnce(groupId);
				etherpadClientAdapter.getOrCreateEtherpadId.mockResolvedValueOnce(padId);
				etherpadClientAdapter.getOrCreateAuthorId.mockResolvedValueOnce(authorId);
				etherpadClientAdapter.getOrCreateSessionId.mockResolvedValueOnce(sessionId);
				etherpadClientAdapter.listSessionIdsOfAuthor.mockResolvedValueOnce(authorsSessionIds);

				jest.useFakeTimers();
				jest.setSystemTime(dateMock);

				return {
					userId,
					userName,
					params,
					groupId,
					padId,
					authorId,
					sessionId,
					authorsSessionIds,
					url,
					sessionExpiryDate,
					dateMock,
				};
			};

			it('should return collaborative text editor', async () => {
				const { userId, padId, userName, params, url, sessionExpiryDate } = setup();

				const result = await service.getOrCreateCollaborativeTextEditor(userId, userName, params);

				expect(result).toEqual({
					sessionId: 'sessionId1',
					url: `${url}/${padId}`,
					path: `/p/${padId}`,
					sessionExpiryDate,
				});
			});

			it('should call etherpadClientAdapter methods with correct parameter', async () => {
				const { userId, userName, params, groupId, authorId, sessionExpiryDate } = setup();

				await service.getOrCreateCollaborativeTextEditor(userId, userName, params);

				expect(etherpadClientAdapter.getOrCreateGroupId).toHaveBeenCalledWith(params.parentId);
				expect(etherpadClientAdapter.getOrCreateEtherpadId).toHaveBeenCalledWith(groupId, params.parentId);
				expect(etherpadClientAdapter.getOrCreateAuthorId).toHaveBeenCalledWith(userId, userName);
				expect(etherpadClientAdapter.getOrCreateSessionId).toHaveBeenCalledWith(
					groupId,
					authorId,
					params.parentId,
					sessionExpiryDate,
					COOKIE_RELEASE_THRESHOLD
				);
			});
		});

		describe('WHEN etherpadClientAdapter.getOrCreateGroup throws an error', () => {
			const setup = () => {
				const { userId, userName, params, dateMock } = buildParameter();
				const error = new Error('error');

				etherpadClientAdapter.getOrCreateGroupId.mockRejectedValueOnce(error);

				jest.useFakeTimers();
				jest.setSystemTime(dateMock);

				return { userId, userName, params, error };
			};

			it('should throw an error', async () => {
				const { userId, userName, params, error } = setup();

				await expect(service.getOrCreateCollaborativeTextEditor(userId, userName, params)).rejects.toThrowError(error);
			});
		});

		describe('WHEN etherpadClientAdapter.getOrCreateEtherpad throws an error', () => {
			const setup = () => {
				const { userId, userName, params, dateMock, groupId } = buildParameter();
				const error = new Error('error');

				etherpadClientAdapter.getOrCreateGroupId.mockResolvedValueOnce(groupId);
				etherpadClientAdapter.getOrCreateEtherpadId.mockRejectedValueOnce(error);

				jest.useFakeTimers();
				jest.setSystemTime(dateMock);

				return { userId, userName, params, error };
			};

			it('should throw an error', async () => {
				const { userId, userName, params, error } = setup();

				await expect(service.getOrCreateCollaborativeTextEditor(userId, userName, params)).rejects.toThrowError(error);
			});
		});

		describe('WHEN etherpadClientAdapter.getOrCreateAuthor throws an error', () => {
			const setup = () => {
				const { userId, userName, params, dateMock, groupId, padId } = buildParameter();
				const error = new Error('error');

				etherpadClientAdapter.getOrCreateGroupId.mockResolvedValueOnce(groupId);
				etherpadClientAdapter.getOrCreateEtherpadId.mockResolvedValueOnce(padId);
				etherpadClientAdapter.getOrCreateAuthorId.mockRejectedValueOnce(error);

				jest.useFakeTimers();
				jest.setSystemTime(dateMock);

				return { userId, userName, params, error };
			};

			it('should throw an error', async () => {
				const { userId, userName, params, error } = setup();

				await expect(service.getOrCreateCollaborativeTextEditor(userId, userName, params)).rejects.toThrowError(error);
			});
		});

		describe('WHEN etherpadClientAdapter.getOrCreateSession throws an error', () => {
			const setup = () => {
				const { userId, userName, params, dateMock, groupId, padId, authorId } = buildParameter();
				const error = new Error('error');

				etherpadClientAdapter.getOrCreateGroupId.mockResolvedValueOnce(groupId);
				etherpadClientAdapter.getOrCreateEtherpadId.mockResolvedValueOnce(padId);
				etherpadClientAdapter.getOrCreateAuthorId.mockResolvedValueOnce(authorId);
				etherpadClientAdapter.getOrCreateSessionId.mockRejectedValueOnce(error);

				jest.useFakeTimers();
				jest.setSystemTime(dateMock);

				return { userId, userName, params, error };
			};

			it('should throw an error', async () => {
				const { userId, userName, params, error } = setup();

				await expect(service.getOrCreateCollaborativeTextEditor(userId, userName, params)).rejects.toThrowError(error);
			});
		});
	});

	describe('deleteCollaborativeTextEditorByParentId', () => {
		describe('WHEN etherpadClientAdapter.deleteGroup returns successfully', () => {
			const setup = () => {
				const parentId = 'parentId';
				const groupId = 'groupId';

				etherpadClientAdapter.getOrCreateGroupId.mockResolvedValueOnce(groupId);

				return { parentId, groupId };
			};

			it('should call etherpadClientAdapter.getOrCreateGroupId with correct parameter', async () => {
				const { parentId } = setup();

				await service.deleteCollaborativeTextEditorByParentId(parentId);

				expect(etherpadClientAdapter.getOrCreateGroupId).toHaveBeenCalledWith(parentId);
			});
		});

		describe('WHEN etherpadClientAdapter.getOrCreateGroupId throws an error', () => {
			const setup = () => {
				const parentId = 'parentId';
				const error = new Error('error');

				etherpadClientAdapter.getOrCreateGroupId.mockRejectedValueOnce(error);

				return { parentId, error };
			};

			it('should throw an error', async () => {
				const { parentId, error } = setup();

				await expect(service.deleteCollaborativeTextEditorByParentId(parentId)).rejects.toThrowError(error);
			});
		});

		describe('WHEN etherpadClientAdapter.deleteGroup throws an error', () => {
			const setup = () => {
				const parentId = 'parentId';
				const groupId = 'groupId';
				const error = new Error('error');

				etherpadClientAdapter.getOrCreateGroupId.mockResolvedValueOnce(groupId);
				etherpadClientAdapter.deleteGroup.mockRejectedValueOnce(error);

				return { parentId, groupId, error };
			};

			it('should throw an error', async () => {
				const { parentId, error } = setup();

				await expect(service.deleteCollaborativeTextEditorByParentId(parentId)).rejects.toThrowError(error);
			});
		});
	});

	describe('deleteSessionsByUser', () => {
		describe('WHEN sessions are deleted successfully', () => {
			const setup = () => {
				const userId = 'userId';
				const authorId = 'authorId';
				const sessionIds = ['sessionId1', 'sessionId2'];

				etherpadClientAdapter.getOrCreateAuthorId.mockResolvedValueOnce(authorId);
				etherpadClientAdapter.listSessionIdsOfAuthor.mockResolvedValueOnce(sessionIds);
				etherpadClientAdapter.deleteSession.mockResolvedValueOnce();
				etherpadClientAdapter.deleteSession.mockResolvedValueOnce();

				return { userId, authorId, sessionIds };
			};

			it('should call etherpadClientAdapter.getOrCreateAuthorId with correct parameter', async () => {
				const { userId } = setup();

				await service.deleteSessionsByUser(userId);

				expect(etherpadClientAdapter.getOrCreateAuthorId).toHaveBeenCalledWith(userId);
			});

			it('should call etherpadClientAdapter.listSessionIdsOfAuthor with correct parameter', async () => {
				const { userId, authorId } = setup();

				await service.deleteSessionsByUser(userId);

				expect(etherpadClientAdapter.listSessionIdsOfAuthor).toHaveBeenCalledWith(authorId);
			});

			it('should call etherpadClientAdapter.deleteSession with correct parameter', async () => {
				const { userId, sessionIds } = setup();

				await service.deleteSessionsByUser(userId);

				expect(etherpadClientAdapter.deleteSession).toHaveBeenNthCalledWith(1, sessionIds[0]);
				expect(etherpadClientAdapter.deleteSession).toHaveBeenNthCalledWith(2, sessionIds[1]);
			});
		});

		describe('WHEN etherpadClientAdapter.getOrCreateAuthorId throws an error', () => {
			const setup = () => {
				const userId = 'userId';
				const error = new Error('error');

				etherpadClientAdapter.getOrCreateAuthorId.mockRejectedValueOnce(error);

				return { userId, error };
			};

			it('should throw an error', async () => {
				const { userId, error } = setup();

				await expect(service.deleteSessionsByUser(userId)).rejects.toThrowError(error);
			});
		});

		describe('WHEN etherpadClientAdapter.listSessionIdsOfAuthor throws an error', () => {
			const setup = () => {
				const userId = 'userId';
				const authorId = 'authorId';
				const error = new Error('error');

				etherpadClientAdapter.getOrCreateAuthorId.mockResolvedValueOnce(authorId);
				etherpadClientAdapter.listSessionIdsOfAuthor.mockRejectedValueOnce(error);

				return { userId, authorId, error };
			};

			it('should throw an error', async () => {
				const { userId, error } = setup();

				await expect(service.deleteSessionsByUser(userId)).rejects.toThrowError(error);
			});
		});

		describe('WHEN etherpadClientAdapter.deleteSession throws an error', () => {
			const setup = () => {
				const userId = 'userId';
				const authorId = 'authorId';
				const sessionIds = ['sessionId1', 'sessionId2'];
				const error = new Error('error');

				etherpadClientAdapter.getOrCreateAuthorId.mockResolvedValueOnce(authorId);
				etherpadClientAdapter.listSessionIdsOfAuthor.mockResolvedValueOnce(sessionIds);
				etherpadClientAdapter.deleteSession.mockResolvedValueOnce();
				etherpadClientAdapter.deleteSession.mockRejectedValueOnce(error);

				return { userId, authorId, sessionIds, error };
			};

			it('should throw an error', async () => {
				const { userId, error } = setup();

				await expect(service.deleteSessionsByUser(userId)).rejects.toThrowError(error);
			});
		});
	});
});
