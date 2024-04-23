import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import {
	AuthorApi,
	GroupApi,
	InlineResponse200,
	InlineResponse2001,
	InlineResponse2002,
	InlineResponse2003,
	InlineResponse2004,
	InlineResponse2006,
	PadApi,
	SessionApi,
} from './etherpad-api-client';
import { EtherpadClientAdapter } from './etherpad-client.adapter';
import { EtherpadErrorType } from './interface';
import { EtherpadErrorLoggableException } from './loggable';

describe(EtherpadClientAdapter.name, () => {
	let module: TestingModule;
	let service: EtherpadClientAdapter;
	let groupApi: DeepMocked<GroupApi>;
	let sessionApi: DeepMocked<SessionApi>;
	let authorApi: DeepMocked<AuthorApi>;

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
						code: 0,
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
						code: 0,
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
						code: 0,
						data: { sessionID: 'sessionId' },
					},
				});

				const listSessionsResponse = createMock<AxiosResponse<InlineResponse2006>>({
					data: {
						code: 0,
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
						code: 0,
						data: { sessionID: 'sessionId' },
					},
				});

				const listSessionsResponse = createMock<AxiosResponse<InlineResponse2006>>({
					data: {
						code: 0,
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
						code: 0,
						data: {},
					},
				});

				authorApi.listSessionsOfAuthorUsingGET.mockResolvedValue(listSessionsResponse);

				const response = createMock<AxiosResponse<InlineResponse2004>>({
					data: {
						code: 0,
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
						code: 0,
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
						code: 0,
						// @ts-expect-error wrong type mapping
						data: { 'session-id-1': { groupID: 'groupId', authorID: authorId } },
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
						code: 0,
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
						code: 0,
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

	describe('getOrCreateGroupId', () => {
		describe('when group does not exist', () => {
			const setup = () => {
				const parentId = 'parentId';
				const response = createMock<AxiosResponse<InlineResponse200>>({
					data: {
						code: 0,
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
					data: { code: 0 },
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
						code: 0,
						data: { padID: 'padId' },
					},
				});

				const listPadsResponse = createMock<AxiosResponse<InlineResponse2002>>({
					data: {
						code: 0,
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
						code: 0,
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
						code: 0,
						data: { padIDs: [] },
					},
				});
				const response = createMock<AxiosResponse<InlineResponse2001>>({
					data: {
						code: 0,
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
						code: 0,
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

	describe('handleEtherpadResponse', () => {
		const setup = (code = 0) => {
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

		describe('wehn status code is 0', () => {
			it('should return data', async () => {
				const parentId = setup();

				const result = await service.getOrCreateGroupId(parentId);

				expect(result).toEqual('groupId');
			});
		});

		describe('when status code is 1', () => {
			it('should throw an error', async () => {
				const parentId = setup(1);

				const result = service.getOrCreateGroupId(parentId);

				await expect(result).rejects.toThrowError(EtherpadErrorType.BAD_REQUEST);
				await expect(result).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});

		describe('when status code is 2', () => {
			it('should throw an error', async () => {
				const parentId = setup(2);

				const result = service.getOrCreateGroupId(parentId);

				await expect(result).rejects.toThrowError(EtherpadErrorType.INTERNAL_ERROR);
				await expect(result).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});

		describe('when status code is 3', () => {
			it('should throw an error', async () => {
				const parentId = setup(3);

				const result = service.getOrCreateGroupId(parentId);

				await expect(result).rejects.toThrowError(EtherpadErrorType.FUNCTION_NOT_FOUND);
				await expect(result).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});

		describe('when status code is 4', () => {
			it('should throw an error', async () => {
				const parentId = setup(4);

				const result = service.getOrCreateGroupId(parentId);

				await expect(result).rejects.toThrowError(EtherpadErrorType.WRONG_API_KEY);
				await expect(result).rejects.toThrowError(EtherpadErrorLoggableException);
			});
		});

		describe('when status code is other than known code', () => {
			it('should throw an error', async () => {
				const parentId = setup(5);

				const result = service.getOrCreateGroupId(parentId);

				const exception = new InternalServerErrorException('Etherpad Response Code unknown');
				await expect(result).rejects.toThrowError(exception);
			});
		});
	});
});
