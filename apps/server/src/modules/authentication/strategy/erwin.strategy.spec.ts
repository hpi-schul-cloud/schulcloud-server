import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ErwinStrategy } from './erwin.strategy';
import { Account } from '@modules/account';
import { UserDo } from '@modules/user';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import { Oauth2ContextHelper, Oauth2ContextResult } from '../helper/oauth2-context.helper';

describe(ErwinStrategy.name, () => {
	let module: TestingModule;
	let strategy: ErwinStrategy;
	let oauth2ContextHelper: DeepMocked<Oauth2ContextHelper>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ErwinStrategy,
				{
					provide: Oauth2ContextHelper,
					useValue: createMock<Oauth2ContextHelper>(),
				},
			],
		}).compile();

		strategy = module.get(ErwinStrategy);
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
				const systemId = 'erwin-system-id';
				const userId = 'user-id';
				const accountId = 'account-id';

				const user: UserDo = {
					id: userId,
					email: '',
					firstName: '',
					lastName: '',
					roles: [],
					schoolId: 'schoolId',
					secondarySchools: [],
				};

				const account = new Account({ id: accountId, username: 'username', systemId });

				const contextResult: Oauth2ContextResult = {
					user,
					account,
					tokenDto: {
						idToken: 'id-token',
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

				return { request, contextResult, userId, accountId, systemId };
			};

			it('should call oauth2ContextHelper.buildOauth2Context with request body', async () => {
				const { request } = setup();

				await strategy.validate(request);

				expect(oauth2ContextHelper.buildOauth2Context).toHaveBeenCalledWith(request.body);
			});

			it('should return currentUser with correct properties', async () => {
				const { request, userId, accountId, systemId } = setup();

				const result = await strategy.validate(request);

				expect(result).toBeDefined();
				expect(result.userId).toBe(userId);
				expect(result.accountId).toBe(accountId);
				expect(result.systemId).toBe(systemId);
				expect(result.isExternalUser).toBe(true);
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
