/* eslint-disable filename-rules/match */
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Account } from '@modules/account';
import { UserDo } from '@modules/user';
import { RoleName } from '@modules/role';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import { Oauth2ContextHelper, Oauth2ContextResult } from '../helper/oauth2-context.helper';
import { Oauth2Strategy } from './oauth2.strategy';

describe(Oauth2Strategy.name, () => {
	let module: TestingModule;
	let strategy: Oauth2Strategy;
	let oauth2ContextHelper: DeepMocked<Oauth2ContextHelper>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				Oauth2Strategy,
				{
					provide: Oauth2ContextHelper,
					useValue: createMock<Oauth2ContextHelper>(),
				},
			],
		}).compile();

		strategy = module.get(Oauth2Strategy);
		oauth2ContextHelper = module.get(Oauth2ContextHelper);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('validate', () => {
		describe('when oauth2ContextHelper returns valid context', () => {
			const setup = () => {
				const systemId = 'oauth2-system-id';
				const userId = 'user-id';
				const accountId = 'account-id';
				const idToken = 'id-token';

				const user: UserDo = {
					id: userId,
					email: '',
					firstName: '',
					lastName: '',
					roles: [{ id: 'roleId', name: RoleName.USER }],
					schoolId: 'schoolId',
					secondarySchools: [],
				};

				const account = new Account({ id: accountId, username: 'username', systemId });

				const contextResult: Oauth2ContextResult = {
					user,
					account,
					tokenDto: {
						idToken,
						accessToken: 'access-token',
						refreshToken: 'refresh-token',
					},
					systemId,
				};

				oauth2ContextHelper.buildOauth2Context.mockResolvedValue(contextResult);

				const request = {
					body: {
						redirectUri: 'http://localhost/redirect',
						code: 'auth-code',
						systemId,
					} as Oauth2AuthorizationBodyParams,
				};

				return { request, contextResult, userId, accountId, systemId, idToken };
			};

			it('should call oauth2ContextHelper.buildOauth2Context with request body', async () => {
				const { request } = setup();

				await strategy.validate(request);

				expect(oauth2ContextHelper.buildOauth2Context).toHaveBeenCalledWith(request.body);
			});

			it('should return currentUser with correct properties', async () => {
				const { request, userId, accountId, systemId, idToken } = setup();

				const result = await strategy.validate(request);

				expect(result).toBeDefined();
				expect(result.userId).toBe(userId);
				expect(result.accountId).toBe(accountId);
				expect(result.systemId).toBe(systemId);
				expect(result.externalIdToken).toBe(idToken);
			});
		});

		describe('when oauth2ContextHelper throws an error', () => {
			const setup = () => {
				const error = new Error('Test error');
				oauth2ContextHelper.buildOauth2Context.mockRejectedValue(error);

				const request = {
					body: {
						redirectUri: 'http://localhost/redirect',
						code: 'auth-code',
						systemId: 'system-id',
					} as Oauth2AuthorizationBodyParams,
				};

				return { request, error };
			};

			it('should propagate the error', async () => {
				const { request, error } = setup();

				await expect(strategy.validate(request)).rejects.toThrow(error);
			});
		});
	});
});
