import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { EtherpadClientAdapter } from '@src/infra/etherpad-client';
import { CollaborativeTextEditorParentType } from '../api/dto/get-collaborative-text-editor-for-parent.params';
import { CollaborativeTextEditorService } from './collaborative-text-editor.service';

describe('CollaborativeTextEditorService', () => {
	let service: CollaborativeTextEditorService;
	let configService: DeepMocked<ConfigService>;
	let etherpadClientAdapter: DeepMocked<EtherpadClientAdapter>;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CollaborativeTextEditorService,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: EtherpadClientAdapter,
					useValue: createMock<EtherpadClientAdapter>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(CollaborativeTextEditorService);
		configService = module.get(ConfigService);
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
			const cookieExpiresSeconds = 2;
			const releaseThreshold = 5;
			const dateMock = new Date(2022, 1, 22);
			const sessionExpiryDate = new Date(dateMock.getTime() + cookieExpiresSeconds * 1000);

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
				cookieExpiresSeconds,
				releaseThreshold,
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
					cookieExpiresSeconds,
					sessionExpiryDate,
					dateMock,
					releaseThreshold,
				} = buildParameter();

				configService.get.mockReturnValueOnce(cookieExpiresSeconds);
				configService.get.mockReturnValueOnce(releaseThreshold);
				configService.get.mockReturnValueOnce(url);
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
					cookieExpiresSeconds,
					sessionExpiryDate,
					releaseThreshold,
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
				const { userId, userName, params, groupId, authorId, sessionExpiryDate, releaseThreshold } = setup();

				await service.getOrCreateCollaborativeTextEditor(userId, userName, params);

				expect(etherpadClientAdapter.getOrCreateGroupId).toHaveBeenCalledWith(params.parentId);
				expect(etherpadClientAdapter.getOrCreateEtherpadId).toHaveBeenCalledWith(groupId, params.parentId);
				expect(etherpadClientAdapter.getOrCreateAuthorId).toHaveBeenCalledWith(userId, userName);
				expect(etherpadClientAdapter.getOrCreateSessionId).toHaveBeenCalledWith(
					groupId,
					authorId,
					params.parentId,
					sessionExpiryDate,
					releaseThreshold
				);
			});
		});

		describe('WHEN etherpadClientAdapter.getOrCreateGroup throws an error', () => {
			const setup = () => {
				const { userId, userName, params, dateMock, cookieExpiresSeconds, releaseThreshold } = buildParameter();
				const error = new Error('error');

				configService.get.mockReturnValueOnce(cookieExpiresSeconds);
				configService.get.mockReturnValueOnce(releaseThreshold);

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
				const { userId, userName, params, dateMock, cookieExpiresSeconds, groupId } = buildParameter();
				const error = new Error('error');

				configService.get.mockReturnValueOnce(cookieExpiresSeconds);
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
				const { userId, userName, params, dateMock, cookieExpiresSeconds, groupId, padId } = buildParameter();
				const error = new Error('error');

				configService.get.mockReturnValueOnce(cookieExpiresSeconds);
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
				const { userId, userName, params, dateMock, cookieExpiresSeconds, groupId, padId, authorId } = buildParameter();
				const error = new Error('error');

				configService.get.mockReturnValueOnce(cookieExpiresSeconds);
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
