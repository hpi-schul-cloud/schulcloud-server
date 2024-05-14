import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import {
	AuthorApi,
	GroupApi,
	InlineResponse200,
	InlineResponse2001,
	InlineResponse20013,
	InlineResponse2002,
	InlineResponse2003,
	InlineResponse2004,
	InlineResponse2006,
	PadApi,
	SessionApi,
} from './etherpad-api-client';
import { EtherpadClientAdapter } from './etherpad-client.adapter';
import { EtherpadErrorType, EtherpadResponseCode } from './interface';
import { EtherpadErrorLoggableException } from './loggable';

describe(EtherpadClientAdapter.name, () => {
	let module: TestingModule;
	let service: EtherpadClientAdapter;
	let groupApi: DeepMocked<GroupApi>;
	let sessionApi: DeepMocked<SessionApi>;
	let authorApi: DeepMocked<AuthorApi>;
	let padApi: DeepMocked<PadApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				EtherpadClientAdapter,
				{
					provide: GroupApi,
					useValue: createMock<GroupApi>(),
				},
				{
					provide: SessionApi,
					useValue: createMock<SessionApi>(),
				},
				{
					provide: AuthorApi,
					useValue: createMock<AuthorApi>(),
				},
				{
					provide: PadApi,
					useValue: createMock<PadApi>(),
				},
			],
		}).compile();

		service = module.get(EtherpadClientAdapter);
		sessionApi = module.get(SessionApi);
		authorApi = module.get(AuthorApi);
		groupApi = module.get(GroupApi);
		padApi = module.get(PadApi);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getOrCreateAuthorId', () => {
		describe('when createAuthorIfNotExistsForUsingGET resolves succesful', () => {
			const setup = () => {
				const userId = 'userId';
				const username = 'username';
				const response = createMock<AxiosResponse<InlineResponse2003>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: { authorID: 'authorId' },
					},
				});

				authorApi.createAuthorIfNotExistsForUsingGET.mockResolvedValue(response);
				return { userId, username };
			};

			it('should return author id', async () => {
				const { userId, username } = setup();

				const result = await service.getOrCreateAuthorId(userId, username);

				expect(result).toBe('authorId');
			});

			it('should call createAuthorIfNotExistsForUsingGET with correct params', async () => {
				const { userId, username } = setup();

				await service.getOrCreateAuthorId(userId, username);

				expect(authorApi.createAuthorIfNotExistsForUsingGET).toBeCalledWith(userId, username);
			});
		});

		describe('when createAuthorIfNotExistsForUsingGET response is empty', () => {
			const setup = () => {
				const userId = 'userId';
				const username = 'username';
				const response = createMock<AxiosResponse<InlineResponse2003>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: {},
					},
				});

				authorApi.createAuthorIfNotExistsForUsingGET.mockResolvedValue(response);
				return { userId, username };
			};

			it('should throw an error', async () => {
				const { userId, username } = setup();

				await expect(service.getOrCreateAuthorId(userId, username)).rejects.toThrowError('Author could not be created');
			});
		});

		describe('when createAuthorIfNotExistsForUsingGET returns error', () => {
			const setup = () => {
				const userId = 'userId';
				const username = 'username';

				authorApi.createAuthorIfNotExistsForUsingGET.mockRejectedValueOnce(new Error('error'));

				return { userId, username };
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const { userId, username } = setup();

				await expect(service.getOrCreateAuthorId(userId, username)).rejects.toThrowError(
					EtherpadErrorLoggableException
				);
			});
		});
	});

	describe('getOrCreateSessionId', () => {
		describe('when session already exists', () => {
			const setup = () => {
				const groupId = 'groupId';
				const authorId = 'authorId';
				const parentId = 'parentId';
				const sessionCookieExpire = new Date();
				const response = createMock<AxiosResponse<InlineResponse2004>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: { sessionID: 'sessionId' },
					},
				});

				const listSessionsResponse = createMock<AxiosResponse<InlineResponse2006>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: {
							// @ts-expect-error wrong type mapping
							'session-id-1': { groupID: groupId, authorID: authorId },
							'session-id-2': { groupID: 'other-group-id', authorID: 'other-author-id' },
						},
					},
				});

				authorApi.listSessionsOfAuthorUsingGET.mockResolvedValue(listSessionsResponse);

				sessionApi.createSessionUsingGET.mockResolvedValue(response);
				return { groupId, authorId, parentId, sessionCookieExpire };
			};

			it('should return session id', async () => {
				const { groupId, authorId, parentId, sessionCookieExpire } = setup();

				const result = await service.getOrCreateSessionId(groupId, authorId, parentId, sessionCookieExpire);

				expect(result).toBe('session-id-1');
			});

			it('should not call createSessionUsingGET', async () => {
				const { groupId, authorId, parentId, sessionCookieExpire } = setup();

				await service.getOrCreateSessionId(groupId, authorId, parentId, sessionCookieExpire);

				expect(sessionApi.createSessionUsingGET).not.toBeCalled();
			});
		});

		describe('when session does not exist', () => {
			const setup = () => {
				const groupId = 'groupId';
				const authorId = 'authorId';
				const parentId = 'parentId';
				const sessionCookieExpire = new Date();
				const response = createMock<AxiosResponse<InlineResponse2004>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: { sessionID: 'sessionId' },
					},
				});

				const listSessionsResponse = createMock<AxiosResponse<InlineResponse2006>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: {},
					},
				});

				authorApi.listSessionsOfAuthorUsingGET.mockResolvedValue(listSessionsResponse);
				sessionApi.createSessionUsingGET.mockResolvedValue(response);
				return { groupId, authorId, parentId, sessionCookieExpire };
			};

			it('should return session id', async () => {
				const { groupId, authorId, parentId, sessionCookieExpire } = setup();

				const result = await service.getOrCreateSessionId(groupId, authorId, parentId, sessionCookieExpire);

				expect(result).toBe('sessionId');
			});

			it('should call createSessionUsingGET with correct params', async () => {
				const { groupId, authorId, parentId, sessionCookieExpire } = setup();

				await service.getOrCreateSessionId(groupId, authorId, parentId, sessionCookieExpire);

				expect(sessionApi.createSessionUsingGET).toBeCalledWith(
					groupId,
					authorId,
					sessionCookieExpire.getTime().toString()
				);
			});
		});

		describe('when createSessionUsingGET response is empty', () => {
			const setup = () => {
				const groupId = 'groupId';
				const authorId = 'authorId';
				const parentId = 'parentId';
				const sessionCookieExpire = new Date();
				const listSessionsResponse = createMock<AxiosResponse<InlineResponse2006>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: {},
					},
				});

				authorApi.listSessionsOfAuthorUsingGET.mockResolvedValue(listSessionsResponse);

				const response = createMock<AxiosResponse<InlineResponse2004>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: {},
					},
				});

				sessionApi.createSessionUsingGET.mockResolvedValue(response);
				return { groupId, authorId, parentId, sessionCookieExpire };
			};

			it('should throw an error', async () => {
				const { groupId, authorId, parentId, sessionCookieExpire } = setup();

				await expect(
					service.getOrCreateSessionId(groupId, authorId, parentId, sessionCookieExpire)
				).rejects.toThrowError('Session could not be created');
			});
		});

		describe('when createSessionUsingGET returns error', () => {
			const setup = () => {
				const groupId = 'groupId';
				const authorId = 'authorId';
				const parentId = 'parentId';
				const sessionCookieExpire = new Date();
				const listSessionsResponse = createMock<AxiosResponse<InlineResponse2006>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: {},
					},
				});

				authorApi.listSessionsOfAuthorUsingGET.mockResolvedValue(listSessionsResponse);

				sessionApi.createSessionUsingGET.mockRejectedValueOnce(new Error('error'));
				return { groupId, authorId, parentId, sessionCookieExpire };
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const { groupId, authorId, parentId, sessionCookieExpire } = setup();

				await expect(
					service.getOrCreateSessionId(groupId, authorId, parentId, sessionCookieExpire)
				).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});
	});

	describe('listSessionIdsOfAuthor', () => {
		describe('when author has sessions', () => {
			const setup = () => {
				const authorId = 'authorId';
				const response = createMock<AxiosResponse<InlineResponse2006>>({
					data: {
						code: EtherpadResponseCode.OK,
						// @ts-expect-error wrong type mapping
						data: { 'session-id-1': { groupID: 'groupId', authorID: authorId }, 'session-id-2': null },
					},
				});

				authorApi.listSessionsOfAuthorUsingGET.mockResolvedValue(response);
				return authorId;
			};

			it('should return session ids', async () => {
				const authorId = setup();

				const result = await service.listSessionIdsOfAuthor(authorId);

				expect(result).toEqual(['session-id-1']);
			});
		});

		describe('when author has no sessions', () => {
			const setup = () => {
				const authorId = 'authorId';
				const response = createMock<AxiosResponse<InlineResponse2006>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: {},
					},
				});

				authorApi.listSessionsOfAuthorUsingGET.mockResolvedValue(response);
				return authorId;
			};

			it('should return empty array', async () => {
				const authorId = setup();

				const result = await service.listSessionIdsOfAuthor(authorId);

				expect(result).toEqual([]);
			});
		});

		describe('when listSessionsOfAuthorUsingGET returns error', () => {
			const setup = () => {
				const authorId = 'authorId';

				authorApi.listSessionsOfAuthorUsingGET.mockRejectedValueOnce(new Error('error'));

				return authorId;
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const authorId = setup();

				await expect(service.listSessionIdsOfAuthor(authorId)).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});

		describe('when InlineResponse2006Data is not an object', () => {
			const setup = () => {
				const authorId = 'authorId';
				const response = createMock<AxiosResponse<InlineResponse2006>>({
					data: {
						code: EtherpadResponseCode.OK,
						// @ts-expect-error wrong type mapping
						data: [],
					},
				});

				authorApi.listSessionsOfAuthorUsingGET.mockResolvedValue(response);
				return authorId;
			};

			it('should throw an error', async () => {
				const authorId = setup();

				await expect(service.listSessionIdsOfAuthor(authorId)).rejects.toThrowError(
					'Etherpad session ids response is not an object'
				);
			});
		});
	});

	describe('listPadsOfAuthor', () => {
		describe('when author has pads', () => {
			const setup = () => {
				const authorId = 'authorId';
				const response = createMock<AxiosResponse<InlineResponse2002>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: { padIDs: ['g.s8oes9dhwrvt0zif$test', 'g.s8oejklhwrvt0zif$foo'] },
					},
				});

				authorApi.listPadsOfAuthorUsingGET.mockResolvedValue(response);
				return authorId;
			};

			it('should return pad ids', async () => {
				const authorId = setup();

				const result = await service.listPadsOfAuthor(authorId);

				expect(result).toEqual(['g.s8oes9dhwrvt0zif$test', 'g.s8oejklhwrvt0zif$foo']);
			});
		});

		describe('when author has no pads', () => {
			const setup = () => {
				const authorId = 'authorId';
				const response = createMock<AxiosResponse<InlineResponse2002>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: { padIDs: [] },
					},
				});

				authorApi.listPadsOfAuthorUsingGET.mockResolvedValue(response);
				return authorId;
			};

			it('should return empty array', async () => {
				const authorId = setup();

				const result = await service.listPadsOfAuthor(authorId);

				expect(result).toEqual([]);
			});
		});

		describe('when listPadsOfAuthorUsingGET returns error', () => {
			const setup = () => {
				const authorId = 'authorId';

				authorApi.listPadsOfAuthorUsingGET.mockRejectedValueOnce(new Error('error'));

				return authorId;
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const authorId = setup();

				await expect(service.listPadsOfAuthor(authorId)).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});

		describe('when InlineResponse2002Data is not an object', () => {
			const setup = () => {
				const authorId = 'authorId';
				const response = createMock<AxiosResponse<InlineResponse2002>>({
					data: {
						code: EtherpadResponseCode.OK,
						// @ts-expect-error wrong type mapping
						data: [],
					},
				});

				authorApi.listPadsOfAuthorUsingGET.mockResolvedValue(response);
				return authorId;
			};

			it('should throw an error', async () => {
				const authorId = setup();

				await expect(service.listPadsOfAuthor(authorId)).rejects.toThrowError(
					'Etherpad listPadsOfAuthor response is not an object'
				);
			});
		});
	});

	describe('listAuthorsOfPad', () => {
		describe('when pad has author', () => {
			const setup = () => {
				const padId = 'padId';
				const response = createMock<AxiosResponse<InlineResponse20013>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: { authorIDs: ['a.s8oes9dhwrvt0zif', 'a.akf8finncvomlqva'] },
					},
				});

				padApi.listAuthorsOfPadUsingGET.mockResolvedValue(response);
				return padId;
			};

			it('should return pad ids', async () => {
				const padId = setup();

				const result = await service.listAuthorsOfPad(padId);

				expect(result).toEqual(['a.s8oes9dhwrvt0zif', 'a.akf8finncvomlqva']);
			});
		});

		describe('when pad has no authors', () => {
			const setup = () => {
				const padId = 'padId';
				const response = createMock<AxiosResponse<InlineResponse20013>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: { authorIDs: [] },
					},
				});

				padApi.listAuthorsOfPadUsingGET.mockResolvedValue(response);
				return padId;
			};

			it('should return empty array', async () => {
				const padId = setup();

				const result = await service.listAuthorsOfPad(padId);

				expect(result).toEqual([]);
			});
		});

		describe('when listPadsOfAuthorUsingGET returns error', () => {
			const setup = () => {
				const authorId = 'padId';

				padApi.listAuthorsOfPadUsingGET.mockRejectedValueOnce(new Error('error'));

				return authorId;
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const authorId = setup();

				await expect(service.listAuthorsOfPad(authorId)).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});

		describe('when InlineResponse20013Data is not an object', () => {
			const setup = () => {
				const authorId = 'authorId';
				const response = createMock<AxiosResponse<InlineResponse20013>>({
					data: {
						code: EtherpadResponseCode.OK,
						// @ts-expect-error wrong type mapping
						data: [],
					},
				});

				padApi.listAuthorsOfPadUsingGET.mockResolvedValue(response);
				return authorId;
			};

			it('should throw an error', async () => {
				const padId = setup();

				await expect(service.listAuthorsOfPad(padId)).rejects.toThrowError(
					'Etherpad listAuthorsOfPad response is not an object'
				);
			});
		});
	});

	describe('getOrCreateGroupId', () => {
		describe('when group does not exist', () => {
			const setup = () => {
				const parentId = 'parentId';
				const response = createMock<AxiosResponse<InlineResponse200>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: { groupID: 'groupId' },
					},
				});

				groupApi.createGroupIfNotExistsForUsingGET.mockResolvedValue(response);
				return parentId;
			};

			it('should return group id', async () => {
				const parentId = setup();

				const result = await service.getOrCreateGroupId(parentId);

				expect(result).toBe('groupId');
			});

			it('should call createGroupIfNotExistsForUsingGET with correct params', async () => {
				const parentId = setup();

				await service.getOrCreateGroupId(parentId);

				expect(groupApi.createGroupIfNotExistsForUsingGET).toBeCalledWith(parentId);
			});
		});

		describe('when createGroupIfNotExistsForUsingGET response is empty', () => {
			const setup = () => {
				const parentId = 'parentId';
				const response = createMock<AxiosResponse<InlineResponse200>>({
					data: { code: EtherpadResponseCode.OK },
				});

				groupApi.createGroupIfNotExistsForUsingGET.mockResolvedValue(response);
				return parentId;
			};

			it('should throw an error', async () => {
				const parentId = setup();

				await expect(service.getOrCreateGroupId(parentId)).rejects.toThrowError('Group could not be created');
			});
		});

		describe('when createGroupIfNotExistsForUsingGET returns an error', () => {
			const setup = () => {
				const parentId = 'parentId';

				groupApi.createGroupIfNotExistsForUsingGET.mockRejectedValueOnce(new Error('error'));

				return parentId;
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const parentId = setup();

				await expect(service.getOrCreateGroupId(parentId)).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});
	});

	describe('getOrCreateEtherpadId', () => {
		describe('when pad does not exist', () => {
			const setup = () => {
				const groupId = 'groupId';
				const parentId = 'parentId';
				const response = createMock<AxiosResponse<InlineResponse2001>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: { padID: 'padId' },
					},
				});

				const listPadsResponse = createMock<AxiosResponse<InlineResponse2002>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: { padIDs: [] },
					},
				});

				groupApi.listPadsUsingGET.mockResolvedValue(listPadsResponse);
				groupApi.createGroupPadUsingGET.mockResolvedValue(response);
				return { groupId, parentId };
			};

			it('should return pad id', async () => {
				const { groupId, parentId } = setup();

				const result = await service.getOrCreateEtherpadId(groupId, parentId);

				expect(result).toBe('padId');
			});

			it('should call createGroupPadUsingGET with correct params', async () => {
				const { groupId, parentId } = setup();

				await service.getOrCreateEtherpadId(groupId, parentId);

				expect(groupApi.createGroupPadUsingGET).toBeCalledWith(groupId, parentId);
			});
		});

		describe('when pad exists', () => {
			const setup = () => {
				const groupId = 'groupId';
				const parentId = 'parentId';
				const response = createMock<AxiosResponse<InlineResponse2002>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: { padIDs: ['groupId$parentId'] },
					},
				});

				groupApi.listPadsUsingGET.mockResolvedValue(response);
				return { groupId, parentId };
			};

			it('should return pad id', async () => {
				const { groupId, parentId } = setup();

				const result = await service.getOrCreateEtherpadId(groupId, parentId);

				expect(result).toBe('groupId$parentId');
			});

			it('should not call createGroupPadUsingGET', async () => {
				const { groupId, parentId } = setup();

				await service.getOrCreateEtherpadId(groupId, parentId);

				expect(groupApi.createGroupPadUsingGET).not.toBeCalled();
			});
		});

		describe('when createGroupPadUsingGET response is empty', () => {
			const setup = () => {
				const groupId = 'groupId';
				const parentId = 'parentId';
				const listPadsResponse = createMock<AxiosResponse<InlineResponse2002>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: { padIDs: [] },
					},
				});
				const response = createMock<AxiosResponse<InlineResponse2001>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: {},
					},
				});

				groupApi.listPadsUsingGET.mockResolvedValue(listPadsResponse);
				groupApi.createGroupPadUsingGET.mockResolvedValue(response);
				return { groupId, parentId };
			};

			it('should throw an error', async () => {
				const { groupId, parentId } = setup();

				await expect(service.getOrCreateEtherpadId(groupId, parentId)).rejects.toThrowError('Pad could not be created');
			});
		});

		describe('when createGroupPadUsingGET returns error', () => {
			const setup = () => {
				const groupId = 'groupId';
				const parentId = 'parentId';
				const listPadsResponse = createMock<AxiosResponse<InlineResponse2002>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: { padIDs: [] },
					},
				});

				groupApi.listPadsUsingGET.mockResolvedValue(listPadsResponse);
				groupApi.createGroupPadUsingGET.mockRejectedValueOnce(new Error('error'));

				return { groupId, parentId };
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const { groupId, parentId } = setup();

				await expect(service.getOrCreateEtherpadId(groupId, parentId)).rejects.toThrowError(
					EtherpadErrorLoggableException
				);
			});
		});

		describe('when listPadsUsingGET returns error', () => {
			const setup = () => {
				const groupId = 'groupId';
				const parentId = 'parentId';

				groupApi.listPadsUsingGET.mockRejectedValueOnce(new Error('error'));

				return { groupId, parentId };
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const { groupId, parentId } = setup();

				await expect(service.getOrCreateEtherpadId(groupId, parentId)).rejects.toThrowError(
					EtherpadErrorLoggableException
				);
			});
		});
	});

	describe('deleteGroup', () => {
		describe('when deleteGroupUsingPOST returns successfull', () => {
			const setup = () => {
				const groupId = 'groupId';
				const response = createMock<AxiosResponse<InlineResponse2001>>({
					data: {
						code: EtherpadResponseCode.OK,
						data: {},
					},
				});

				groupApi.deleteGroupUsingPOST.mockResolvedValue(response);

				return groupId;
			};

			it('should call deletePadUsingGET with correct params', async () => {
				const groupId = setup();

				await service.deleteGroup(groupId);

				expect(groupApi.deleteGroupUsingPOST).toBeCalledWith(groupId);
			});
		});

		describe('when deleteGroupUsingPOST returns etherpad error code', () => {
			const setup = () => {
				const groupId = 'groupId';
				const response = createMock<AxiosResponse<InlineResponse2001>>({
					data: {
						code: EtherpadResponseCode.BAD_REQUEST,
						data: {},
					},
				});

				groupApi.deleteGroupUsingPOST.mockResolvedValue(response);

				return groupId;
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const groupId = setup();

				const exception = new EtherpadErrorLoggableException(EtherpadErrorType.BAD_REQUEST, { padId: groupId }, {});
				await expect(service.deleteGroup(groupId)).rejects.toThrowError(exception);
			});
		});

		describe('when deleteGroupUsingPOST returns error', () => {
			const setup = () => {
				const groupId = 'padId';

				groupApi.deleteGroupUsingPOST.mockRejectedValueOnce(new Error('error'));

				return groupId;
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const groupId = setup();

				await expect(service.deleteGroup(groupId)).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});
	});

	describe('deleteSession', () => {
		describe('when deleteSessionUsingPOST returns successfull', () => {
			const setup = () => {
				const sessionId = 'sessionId';
				const response = createMock<AxiosResponse<InlineResponse2001>>({
					data: {
						code: EtherpadResponseCode.OK,
						message: 'ok',
						data: {},
					},
				});

				sessionApi.deleteSessionUsingPOST.mockResolvedValue(response);

				return sessionId;
			};

			it('should call deleteSessionUsingPOST with correct params', async () => {
				const sessionId = setup();

				await service.deleteSession(sessionId);

				expect(sessionApi.deleteSessionUsingPOST).toBeCalledWith(sessionId);
			});
		});

		describe('when deleteSessionUsingPOST returns etherpad error code', () => {
			const setup = () => {
				const sessionId = 'sessionId';
				const response = createMock<AxiosResponse<InlineResponse2001>>({
					data: {
						code: EtherpadResponseCode.BAD_REQUEST,
						data: {},
					},
				});

				sessionApi.deleteSessionUsingPOST.mockResolvedValue(response);

				return sessionId;
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const sessionId = setup();

				const exception = new EtherpadErrorLoggableException(EtherpadErrorType.BAD_REQUEST, { sessionId }, {});
				await expect(service.deleteSession(sessionId)).rejects.toThrowError(exception);
			});
		});

		describe('when deleteSessionUsingPOST returns error', () => {
			const setup = () => {
				const sessionId = 'sessionId';

				sessionApi.deleteSessionUsingPOST.mockRejectedValueOnce(new Error('error'));

				return sessionId;
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const sessionId = setup();

				await expect(service.deleteSession(sessionId)).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});
	});

	describe('deletePad', () => {
		describe('when deletePadUsingPOST returns successfull', () => {
			const setup = () => {
				const padId = 'padId';
				const response = createMock<AxiosResponse<InlineResponse2001>>({
					data: {
						code: EtherpadResponseCode.OK,
						message: 'ok',
						data: {},
					},
				});

				padApi.deletePadUsingPOST.mockResolvedValue(response);

				return padId;
			};

			it('should call deletePadUsingPOST with correct params', async () => {
				const padId = setup();

				await service.deletePad(padId);

				expect(padApi.deletePadUsingPOST).toBeCalledWith(padId);
			});
		});

		describe('when deleteSessionUsingPOST returns etherpad error code', () => {
			const setup = () => {
				const padId = 'padId';
				const response = createMock<AxiosResponse<InlineResponse2001>>({
					data: {
						code: EtherpadResponseCode.BAD_REQUEST,
						data: {},
					},
				});

				padApi.deletePadUsingPOST.mockResolvedValue(response);

				return padId;
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const padId = setup();

				const exception = new EtherpadErrorLoggableException(EtherpadErrorType.BAD_REQUEST, { padId }, {});
				await expect(service.deletePad(padId)).rejects.toThrowError(exception);
			});
		});

		describe('when deleteSessionUsingPOST returns error', () => {
			const setup = () => {
				const padId = 'padId';

				padApi.deletePadUsingPOST.mockRejectedValueOnce(new Error('error'));

				return padId;
			};

			it('should throw EtherpadErrorLoggableException', async () => {
				const padId = setup();

				await expect(service.deletePad(padId)).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});
	});

	describe('handleEtherpadResponse', () => {
		const setup = (code: number) => {
			const parentId = 'parentId';
			const response = createMock<AxiosResponse<InlineResponse200>>({
				data: {
					code,
					data: { groupID: 'groupId' },
				},
			});

			groupApi.createGroupIfNotExistsForUsingGET.mockResolvedValue(response);
			return parentId;
		};

		describe('wehn status code is EtherpadResponseCode.OK', () => {
			it('should return data', async () => {
				const parentId = setup(EtherpadResponseCode.OK);

				const result = await service.getOrCreateGroupId(parentId);

				expect(result).toEqual('groupId');
			});
		});

		describe('when status code is BAD_REQUEST', () => {
			it('should throw an error', async () => {
				const parentId = setup(EtherpadResponseCode.BAD_REQUEST);

				const result = service.getOrCreateGroupId(parentId);

				await expect(result).rejects.toThrowError(EtherpadErrorType.BAD_REQUEST);
				await expect(result).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});

		describe('when status code is INTERNAL_ERROR', () => {
			it('should throw an error', async () => {
				const parentId = setup(EtherpadResponseCode.INTERNAL_ERROR);

				const result = service.getOrCreateGroupId(parentId);

				await expect(result).rejects.toThrowError(EtherpadErrorType.INTERNAL_ERROR);
				await expect(result).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});

		describe('when status code is FUNCTION_NOT_FOUND', () => {
			it('should throw an error', async () => {
				const parentId = setup(EtherpadResponseCode.FUNCTION_NOT_FOUND);

				const result = service.getOrCreateGroupId(parentId);

				await expect(result).rejects.toThrowError(EtherpadErrorType.FUNCTION_NOT_FOUND);
				await expect(result).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});

		describe('when status code is WRONG_API_KEY', () => {
			it('should throw an error', async () => {
				const parentId = setup(EtherpadResponseCode.WRONG_API_KEY);

				const result = service.getOrCreateGroupId(parentId);

				await expect(result).rejects.toThrowError(EtherpadErrorType.WRONG_API_KEY);
				await expect(result).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});

		describe('when status code is other than known code', () => {
			it('should throw an error', async () => {
				const parentId = setup(5);

				const result = service.getOrCreateGroupId(parentId);

				const exception = new InternalServerErrorException('Etherpad response code unknown');
				await expect(result).rejects.toThrowError(exception);
			});
		});
	});
});
