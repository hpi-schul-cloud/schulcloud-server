import { DeepMocked, createMock } from '@golevelup/ts-jest';
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
			const url = 'url';
			const cookieExpiresSeconds = 2;
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
				} = buildParameter();

				configService.get.mockReturnValueOnce(cookieExpiresSeconds);
				configService.get.mockReturnValueOnce(url);
				etherpadClientAdapter.getOrCreateGroup.mockResolvedValueOnce(groupId);
				etherpadClientAdapter.getOrCreatePad.mockResolvedValueOnce(padId);
				etherpadClientAdapter.getOrCreateAuthor.mockResolvedValueOnce(authorId);
				etherpadClientAdapter.getOrCreateSession.mockResolvedValueOnce(sessionId);
				etherpadClientAdapter.listSessionsOfAuthor.mockResolvedValueOnce(authorsSessionIds);

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
					dateMock,
				};
			};

			it('should return collaborative text editor', async () => {
				const { userId, padId, userName, params, url, sessionExpiryDate } = setup();

				const result = await service.createCollaborativeTextEditor(userId, userName, params);

				expect(result).toEqual({
					sessions: ['sessionId1', 'sessionId2'],
					url: `${url}/${padId}`,
					sessionExpiryDate,
				});
			});

			it('should call etherpadClientAdapter methods with correct parameter', async () => {
				const { userId, userName, params, groupId, authorId, sessionExpiryDate } = setup();

				await service.createCollaborativeTextEditor(userId, userName, params);

				expect(etherpadClientAdapter.getOrCreateGroup).toHaveBeenCalledWith(params.parentId);
				expect(etherpadClientAdapter.getOrCreatePad).toHaveBeenCalledWith(groupId, params.parentId);
				expect(etherpadClientAdapter.getOrCreateAuthor).toHaveBeenCalledWith(userId, userName);
				expect(etherpadClientAdapter.getOrCreateSession).toHaveBeenCalledWith(
					groupId,
					authorId,
					params.parentId,
					sessionExpiryDate
				);
				expect(etherpadClientAdapter.listSessionsOfAuthor).toHaveBeenCalledWith(authorId);
			});
		});

		describe('WHEN etherpadClientAdapter.getOrCreateGroup throws an error', () => {
			const setup = () => {
				const { userId, userName, params, dateMock, cookieExpiresSeconds } = buildParameter();
				const error = new Error('error');

				configService.get.mockReturnValueOnce(cookieExpiresSeconds);
				etherpadClientAdapter.getOrCreateGroup.mockRejectedValueOnce(error);

				jest.useFakeTimers();
				jest.setSystemTime(dateMock);

				return { userId, userName, params, error };
			};

			it('should throw an error', async () => {
				const { userId, userName, params, error } = setup();

				await expect(service.createCollaborativeTextEditor(userId, userName, params)).rejects.toThrowError(error);
			});
		});

		describe('WHEN etherpadClientAdapter.getOrCreatePad throws an error', () => {
			const setup = () => {
				const { userId, userName, params, dateMock, cookieExpiresSeconds, groupId } = buildParameter();
				const error = new Error('error');

				configService.get.mockReturnValueOnce(cookieExpiresSeconds);
				etherpadClientAdapter.getOrCreateGroup.mockResolvedValueOnce(groupId);
				etherpadClientAdapter.getOrCreatePad.mockRejectedValueOnce(error);

				jest.useFakeTimers();
				jest.setSystemTime(dateMock);

				return { userId, userName, params, error };
			};

			it('should throw an error', async () => {
				const { userId, userName, params, error } = setup();

				await expect(service.createCollaborativeTextEditor(userId, userName, params)).rejects.toThrowError(error);
			});
		});

		describe('WHEN etherpadClientAdapter.getOrCreateAuthor throws an error', () => {
			const setup = () => {
				const { userId, userName, params, dateMock, cookieExpiresSeconds, groupId, padId } = buildParameter();
				const error = new Error('error');

				configService.get.mockReturnValueOnce(cookieExpiresSeconds);
				etherpadClientAdapter.getOrCreateGroup.mockResolvedValueOnce(groupId);
				etherpadClientAdapter.getOrCreatePad.mockResolvedValueOnce(padId);
				etherpadClientAdapter.getOrCreateAuthor.mockRejectedValueOnce(error);

				jest.useFakeTimers();
				jest.setSystemTime(dateMock);

				return { userId, userName, params, error };
			};

			it('should throw an error', async () => {
				const { userId, userName, params, error } = setup();

				await expect(service.createCollaborativeTextEditor(userId, userName, params)).rejects.toThrowError(error);
			});
		});

		describe('WHEN etherpadClientAdapter.getOrCreateSession throws an error', () => {
			const setup = () => {
				const { userId, userName, params, dateMock, cookieExpiresSeconds, groupId, padId, authorId } = buildParameter();
				const error = new Error('error');

				configService.get.mockReturnValueOnce(cookieExpiresSeconds);
				etherpadClientAdapter.getOrCreateGroup.mockResolvedValueOnce(groupId);
				etherpadClientAdapter.getOrCreatePad.mockResolvedValueOnce(padId);
				etherpadClientAdapter.getOrCreateAuthor.mockResolvedValueOnce(authorId);
				etherpadClientAdapter.getOrCreateSession.mockRejectedValueOnce(error);

				jest.useFakeTimers();
				jest.setSystemTime(dateMock);

				return { userId, userName, params, error };
			};

			it('should throw an error', async () => {
				const { userId, userName, params, error } = setup();

				await expect(service.createCollaborativeTextEditor(userId, userName, params)).rejects.toThrowError(error);
			});
		});

		describe('WHEN etherpadClientAdapter.listSessionsOfAuthor throws an error', () => {
			const setup = () => {
				const { userId, userName, params, dateMock, cookieExpiresSeconds, groupId, padId, authorId, sessionId } =
					buildParameter();
				const error = new Error('error');

				configService.get.mockReturnValueOnce(cookieExpiresSeconds);
				etherpadClientAdapter.getOrCreateGroup.mockResolvedValueOnce(groupId);
				etherpadClientAdapter.getOrCreatePad.mockResolvedValueOnce(padId);
				etherpadClientAdapter.getOrCreateAuthor.mockResolvedValueOnce(authorId);
				etherpadClientAdapter.getOrCreateSession.mockResolvedValueOnce(sessionId);
				etherpadClientAdapter.listSessionsOfAuthor.mockRejectedValueOnce(error);

				jest.useFakeTimers();
				jest.setSystemTime(dateMock);

				return { userId, userName, params, error };
			};

			it('should throw an error', async () => {
				const { userId, userName, params, error } = setup();

				await expect(service.createCollaborativeTextEditor(userId, userName, params)).rejects.toThrowError(error);
			});
		});
	});
});
