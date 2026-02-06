import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { ROCKET_CHAT_CONFIG_TOKEN, RocketChatConfig } from './rocket-chat.config';
import { RocketChatError, RocketChatService } from './rocket-chat.service';

describe('RocketChatService', () => {
	let module: TestingModule;
	let service: RocketChatService;
	let httpService: DeepMocked<HttpService>;
	let config: RocketChatConfig;

	const mockConfig: RocketChatConfig = {
		rocketChatServiceEnabled: true,
		uri: 'http://localhost:3000',
		adminId: 'adminId',
		adminToken: 'adminToken',
		adminUser: 'adminUser',
		adminPassword: 'adminPassword',
	};

	const createAxiosResponse = <T>(data: T): AxiosResponse<T> =>
		({
			data,
			status: 200,
			statusText: 'OK',
			headers: {},
			config: { headers: {} },
		} as AxiosResponse<T>);

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RocketChatService,
				{ provide: ROCKET_CHAT_CONFIG_TOKEN, useValue: { ...mockConfig } },
				{ provide: HttpService, useValue: createMock<HttpService>() },
			],
		}).compile();

		httpService = module.get(HttpService);
		config = module.get(ROCKET_CHAT_CONFIG_TOKEN);
		service = module.get(RocketChatService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('me', () => {
		it('should call GET /api/v1/me with auth headers', async () => {
			const authToken = 'testAuthToken';
			const userId = 'testUserId';
			const expectedData = { _id: userId, username: 'testuser' };

			httpService.get.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.me(authToken, userId);

			expect(httpService.get).toHaveBeenCalledWith(`${config.uri}/api/v1/me`, {
				headers: {
					'X-Auth-Token': authToken,
					'X-User-ID': userId,
				},
			});
			expect(result).toEqual(expectedData);
		});
	});

	describe('setUserStatus', () => {
		it('should call POST /api/v1/users.setStatus with status data', async () => {
			const authToken = 'testAuthToken';
			const userId = 'testUserId';
			const status = 'online';
			const expectedData = { success: true };

			httpService.post.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.setUserStatus(authToken, userId, status);

			expect(httpService.post).toHaveBeenCalledWith(
				`${config.uri}/api/v1/users.setStatus`,
				{ message: '', status },
				{
					headers: {
						'X-Auth-Token': authToken,
						'X-User-ID': userId,
					},
				}
			);
			expect(result).toEqual(expectedData);
		});
	});

	describe('createUserToken', () => {
		it('should call POST /api/v1/users.createToken as admin', async () => {
			const userId = 'testUserId';
			const expectedData = { success: true, data: { authToken: 'token', userId } };

			httpService.post.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.createUserToken(userId);

			expect(httpService.post).toHaveBeenCalledWith(
				`${config.uri}/api/v1/users.createToken`,
				{ userId },
				{
					headers: {
						'X-Auth-Token': config.adminToken,
						'X-User-ID': config.adminId,
					},
				}
			);
			expect(result).toEqual(expectedData);
		});
	});

	describe('logoutUser', () => {
		it('should call POST /api/v1/logout with auth headers', async () => {
			const authToken = 'testAuthToken';
			const userId = 'testUserId';
			const expectedData = { success: true };

			httpService.post.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.logoutUser(authToken, userId);

			expect(httpService.post).toHaveBeenCalledWith(
				`${config.uri}/api/v1/logout`,
				{},
				{
					headers: {
						'X-Auth-Token': authToken,
						'X-User-ID': userId,
					},
				}
			);
			expect(result).toEqual(expectedData);
		});
	});

	describe('getUserList', () => {
		it('should call GET /api/v1/users.list with query string as admin', async () => {
			const queryString = 'count=50&offset=0';
			const expectedData = { users: [], success: true };

			httpService.get.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.getUserList(queryString);

			expect(httpService.get).toHaveBeenCalledWith(`${config.uri}/api/v1/users.list?${queryString}`, {
				headers: {
					'X-Auth-Token': config.adminToken,
					'X-User-ID': config.adminId,
				},
			});
			expect(result).toEqual(expectedData);
		});
	});

	describe('unarchiveGroup', () => {
		it('should call POST /api/v1/groups.unarchive as admin', async () => {
			const groupName = 'testGroup';
			const expectedData = { success: true };

			httpService.post.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.unarchiveGroup(groupName);

			expect(httpService.post).toHaveBeenCalledWith(
				`${config.uri}/api/v1/groups.unarchive`,
				{ roomName: groupName },
				{
					headers: {
						'X-Auth-Token': config.adminToken,
						'X-User-ID': config.adminId,
					},
				}
			);
			expect(result).toEqual(expectedData);
		});
	});

	describe('archiveGroup', () => {
		it('should call POST /api/v1/groups.archive as admin', async () => {
			const groupName = 'testGroup';
			const expectedData = { success: true };

			httpService.post.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.archiveGroup(groupName);

			expect(httpService.post).toHaveBeenCalledWith(
				`${config.uri}/api/v1/groups.archive`,
				{ roomName: groupName },
				{
					headers: {
						'X-Auth-Token': config.adminToken,
						'X-User-ID': config.adminId,
					},
				}
			);
			expect(result).toEqual(expectedData);
		});
	});

	describe('kickUserFromGroup', () => {
		it('should get group info and kick user from group', async () => {
			const groupName = 'testGroup';
			const userId = 'userToKick';
			const groupId = 'groupId123';
			const groupInfoData = { group: { _id: groupId }, success: true };
			const kickData = { success: true };

			httpService.get.mockReturnValue(of(createAxiosResponse(groupInfoData)));
			httpService.post.mockReturnValue(of(createAxiosResponse(kickData)));

			const result = await service.kickUserFromGroup(groupName, userId);

			expect(httpService.get).toHaveBeenCalledWith(`${config.uri}/api/v1/groups.info?roomName=${groupName}`, {
				headers: {
					'X-Auth-Token': config.adminToken,
					'X-User-ID': config.adminId,
				},
			});
			expect(httpService.post).toHaveBeenCalledWith(
				`${config.uri}/api/v1/groups.kick`,
				{ roomId: groupId, userId },
				{
					headers: {
						'X-Auth-Token': config.adminToken,
						'X-User-ID': config.adminId,
					},
				}
			);
			expect(result).toEqual(kickData);
		});
	});

	describe('inviteUserToGroup', () => {
		it('should call POST /api/v1/groups.invite as admin', async () => {
			const groupName = 'testGroup';
			const userId = 'userToInvite';
			const expectedData = { success: true };

			httpService.post.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.inviteUserToGroup(groupName, userId);

			expect(httpService.post).toHaveBeenCalledWith(
				`${config.uri}/api/v1/groups.invite`,
				{ roomName: groupName, userId },
				{
					headers: {
						'X-Auth-Token': config.adminToken,
						'X-User-ID': config.adminId,
					},
				}
			);
			expect(result).toEqual(expectedData);
		});
	});

	describe('addGroupModerator', () => {
		it('should call POST /api/v1/groups.addModerator as admin', async () => {
			const groupName = 'testGroup';
			const userId = 'moderatorUserId';
			const expectedData = { success: true };

			httpService.post.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.addGroupModerator(groupName, userId);

			expect(httpService.post).toHaveBeenCalledWith(
				`${config.uri}/api/v1/groups.addModerator`,
				{ roomName: groupName, userId },
				{
					headers: {
						'X-Auth-Token': config.adminToken,
						'X-User-ID': config.adminId,
					},
				}
			);
			expect(result).toEqual(expectedData);
		});
	});

	describe('removeGroupModerator', () => {
		it('should call POST /api/v1/groups.removeModerator as admin', async () => {
			const groupName = 'testGroup';
			const userId = 'moderatorUserId';
			const expectedData = { success: true };

			httpService.post.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.removeGroupModerator(groupName, userId);

			expect(httpService.post).toHaveBeenCalledWith(
				`${config.uri}/api/v1/groups.removeModerator`,
				{ roomName: groupName, userId },
				{
					headers: {
						'X-Auth-Token': config.adminToken,
						'X-User-ID': config.adminId,
					},
				}
			);
			expect(result).toEqual(expectedData);
		});
	});

	describe('getGroupModerators', () => {
		it('should call GET /api/v1/groups.moderators as admin', async () => {
			const groupName = 'testGroup';
			const expectedData = { moderators: [], success: true };

			httpService.get.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.getGroupModerators(groupName);

			expect(httpService.get).toHaveBeenCalledWith(`${config.uri}/api/v1/groups.moderators?roomName=${groupName}`, {
				headers: {
					'X-Auth-Token': config.adminToken,
					'X-User-ID': config.adminId,
				},
			});
			expect(result).toEqual(expectedData);
		});
	});

	describe('getGroupMembers', () => {
		it('should call GET /api/v1/groups.members as admin', async () => {
			const groupName = 'testGroup';
			const expectedData = { members: [], success: true };

			httpService.get.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.getGroupMembers(groupName);

			expect(httpService.get).toHaveBeenCalledWith(`${config.uri}/api/v1/groups.members?roomName=${groupName}`, {
				headers: {
					'X-Auth-Token': config.adminToken,
					'X-User-ID': config.adminId,
				},
			});
			expect(result).toEqual(expectedData);
		});
	});

	describe('createGroup', () => {
		it('should call POST /api/v1/groups.create as admin', async () => {
			const name = 'newGroup';
			const members = ['user1', 'user2'];
			const expectedData = { group: { _id: 'groupId', name }, success: true };

			httpService.post.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.createGroup(name, members);

			expect(httpService.post).toHaveBeenCalledWith(
				`${config.uri}/api/v1/groups.create`,
				{ name, members },
				{
					headers: {
						'X-Auth-Token': config.adminToken,
						'X-User-ID': config.adminId,
					},
				}
			);
			expect(result).toEqual(expectedData);
		});
	});

	describe('deleteGroup', () => {
		it('should call POST /api/v1/groups.delete as admin', async () => {
			const groupName = 'groupToDelete';
			const expectedData = { success: true };

			httpService.post.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.deleteGroup(groupName);

			expect(httpService.post).toHaveBeenCalledWith(
				`${config.uri}/api/v1/groups.delete`,
				{ roomName: groupName },
				{
					headers: {
						'X-Auth-Token': config.adminToken,
						'X-User-ID': config.adminId,
					},
				}
			);
			expect(result).toEqual(expectedData);
		});
	});

	describe('createUser', () => {
		it('should call POST /api/v1/users.create as admin', async () => {
			const email = 'test@example.com';
			const password = 'password123';
			const username = 'testuser';
			const name = 'Test User';
			const expectedData = { user: { _id: 'userId', username }, success: true };

			httpService.post.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.createUser(email, password, username, name);

			expect(httpService.post).toHaveBeenCalledWith(
				`${config.uri}/api/v1/users.create`,
				{ email, password, username, name, verified: true },
				{
					headers: {
						'X-Auth-Token': config.adminToken,
						'X-User-ID': config.adminId,
					},
				}
			);
			expect(result).toEqual(expectedData);
		});
	});

	describe('deleteUser', () => {
		it('should call POST /api/v1/users.delete as admin', async () => {
			const username = 'userToDelete';
			const expectedData = { success: true };

			httpService.post.mockReturnValue(of(createAxiosResponse(expectedData)));

			const result = await service.deleteUser(username);

			expect(httpService.post).toHaveBeenCalledWith(
				`${config.uri}/api/v1/users.delete`,
				{ username },
				{
					headers: {
						'X-Auth-Token': config.adminToken,
						'X-User-ID': config.adminId,
					},
				}
			);
			expect(result).toEqual(expectedData);
		});
	});

	describe('error handling', () => {
		it('should throw RocketChatError when HTTP GET request fails', async () => {
			const authToken = 'testAuthToken';
			const userId = 'testUserId';
			const errorResponse = {
				response: {
					statusCode: 401,
					statusText: 'Unauthorized',
					data: { errorType: 'unauthorized', error: 'Invalid credentials' },
				},
			};

			httpService.get.mockReturnValue(throwError(() => errorResponse));

			await expect(service.me(authToken, userId)).rejects.toThrow(RocketChatError);
		});

		it('should throw RocketChatError when HTTP POST request fails', async () => {
			const authToken = 'testAuthToken';
			const userId = 'testUserId';
			const errorResponse = {
				response: {
					statusCode: 500,
					statusText: 'Internal Server Error',
					data: { errorType: 'server-error', error: 'Something went wrong' },
				},
			};

			httpService.post.mockReturnValue(throwError(() => errorResponse));

			await expect(service.logoutUser(authToken, userId)).rejects.toThrow(RocketChatError);
		});
	});

	describe('validateRocketChatConfig', () => {
		it('should throw error when uri is not set', async () => {
			const invalidConfig = { ...mockConfig, uri: '' };
			const invalidHttpService = createMock<HttpService>();
			const invalidService = new RocketChatService(invalidConfig, invalidHttpService);

			await expect(invalidService.createUserToken('userId')).rejects.toThrow('rocket chat uri not set');
		});

		it('should throw error when neither adminId/adminToken nor adminUser/adminPassword are set', async () => {
			const invalidConfig = {
				...mockConfig,
				adminId: '',
				adminToken: '',
				adminUser: '',
				adminPassword: '',
			};
			const invalidHttpService = createMock<HttpService>();
			const invalidService = new RocketChatService(invalidConfig, invalidHttpService);

			await expect(invalidService.createUserToken('userId')).rejects.toThrow(
				'rocket chat adminId and adminToken OR adminUser and adminPassword must be set'
			);
		});
	});

	describe('getAdminIdAndToken with login', () => {
		it('should login with adminUser and adminPassword when adminId and adminToken are not set', async () => {
			const configWithoutAdminIdToken = {
				...mockConfig,
				adminId: '',
				adminToken: '',
			};
			const loginHttpService = createMock<HttpService>();
			const loginService = new RocketChatService(configWithoutAdminIdToken, loginHttpService);

			const loginResponse = {
				data: {
					userId: 'loggedInUserId',
					authToken: 'loggedInAuthToken',
				},
			};
			const createTokenResponse = { success: true };

			loginHttpService.post.mockReturnValueOnce(of(createAxiosResponse(loginResponse)));
			loginHttpService.post.mockReturnValueOnce(of(createAxiosResponse(createTokenResponse)));

			await loginService.createUserToken('testUserId');

			expect(loginHttpService.post).toHaveBeenCalledWith(`${configWithoutAdminIdToken.uri}/api/v1/login`, {
				user: configWithoutAdminIdToken.adminUser,
				password: configWithoutAdminIdToken.adminPassword,
			});
		});

		it('should cache admin credentials after first login', async () => {
			const configWithoutAdminIdToken = {
				...mockConfig,
				adminId: '',
				adminToken: '',
			};
			const cacheHttpService = createMock<HttpService>();
			const cacheService = new RocketChatService(configWithoutAdminIdToken, cacheHttpService);

			const loginResponse = {
				data: {
					userId: 'loggedInUserId',
					authToken: 'loggedInAuthToken',
				},
			};
			const successResponse = { success: true };

			cacheHttpService.post.mockReturnValue(of(createAxiosResponse(loginResponse)));
			cacheHttpService.post.mockReturnValueOnce(of(createAxiosResponse(loginResponse)));
			cacheHttpService.post.mockReturnValue(of(createAxiosResponse(successResponse)));

			await cacheService.createUserToken('testUserId1');
			await cacheService.createUserToken('testUserId2');

			// Login should only be called once (the first time)
			const loginCalls = cacheHttpService.post.mock.calls.filter((call) => call[0].includes('/api/v1/login'));
			expect(loginCalls).toHaveLength(1);
		});

		it('should throw RocketChatError when admin login fails', async () => {
			const configWithoutAdminIdToken = {
				...mockConfig,
				adminId: '',
				adminToken: '',
			};
			const failingHttpService = createMock<HttpService>();
			const failingService = new RocketChatService(configWithoutAdminIdToken, failingHttpService);

			const errorResponse = {
				response: {
					statusCode: 401,
					statusText: 'Unauthorized',
					data: { errorType: 'unauthorized', error: 'Invalid admin credentials' },
				},
			};

			failingHttpService.post.mockReturnValue(throwError(() => errorResponse));

			await expect(failingService.createUserToken('testUserId')).rejects.toThrow(RocketChatError);
		});
	});
});

describe('RocketChatError', () => {
	it('should create error from response', () => {
		const errorData = {
			response: {
				statusCode: 401,
				statusText: 'Unauthorized',
				data: { errorType: 'unauthorized', error: 'Invalid credentials' },
			},
		};

		const error = new RocketChatError(errorData);

		expect(error).toBeInstanceOf(Error);
		expect(error.message).toBe('Unauthorized');
	});
});
