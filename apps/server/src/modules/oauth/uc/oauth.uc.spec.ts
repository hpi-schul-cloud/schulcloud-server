import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthUc } from '@src/modules/oauth/uc/oauth.uc';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { SystemService } from '@src/modules/system/service/system.service';
import { AuthorizationParams } from '../controller/dto';
import { OAuthProcessDto } from '../service/dto/oauth-process.dto';
import { OAuthService } from '../service/oauth.service';
import resetAllMocks = jest.resetAllMocks;
import { OauthConfigDto, SystemDto } from '../../system/service';

describe('OAuthUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: OauthUc;

	let oauthService: DeepMocked<OAuthService>;
	let systemService: DeepMocked<SystemService>;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				OauthUc,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
			],
		}).compile();
		uc = module.get(OauthUc);
		systemService = module.get(SystemService);
		oauthService = module.get(OAuthService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	afterEach(() => {
		resetAllMocks();
	});

	describe('processOAuth is called', () => {
		const setup = () => {
			const code = '43534543jnj543342jn2';
			const query: AuthorizationParams = { code };
			const jwt = 'schulcloudJwt';
			const redirect = 'redirect';
			const baseResponse: OAuthProcessDto = {
				redirect,
			};
			const user: UserDO = new UserDO({
				id: 'mockUserId',
				firstName: 'firstName',
				lastName: 'lastame',
				email: '',
				roleIds: [],
				schoolId: 'mockSchoolId',
				externalId: 'mockExternalId',
			});
			const testSystem: SystemDto = new SystemDto({
				id: 'mockSystemId',
				type: 'mock',
				oauthConfig: { provider: 'testProvider' } as OauthConfigDto,
			});
			return { code, query, jwt, redirect, baseResponse, user, testSystem };
		};
		describe('when a user is returned', () => {
			it('should return a response with a valid jwt', async () => {
				const { code, query, jwt, redirect, baseResponse, user, testSystem } = setup();
				oauthService.checkAuthorizationCode.mockReturnValue(code);
				oauthService.authenticateUser.mockResolvedValue({ user, redirect });
				oauthService.getJwtForUser.mockResolvedValue(jwt);

				const response: OAuthProcessDto = await uc.processOAuth(query, testSystem.id!);
				expect(response).toEqual(
					expect.objectContaining({
						jwt,
						...baseResponse,
					})
				);
				expect(response.jwt).toStrictEqual(jwt);
			});
		});

		describe('when no user is returned', () => {
			it('should return a response without a jwt', async () => {
				const { code, query, redirect, baseResponse, testSystem } = setup();
				oauthService.checkAuthorizationCode.mockReturnValue(code);
				oauthService.authenticateUser.mockResolvedValue({ redirect });

				const response: OAuthProcessDto = await uc.processOAuth(query, testSystem.id!);
				expect(response).toEqual(
					expect.objectContaining({
						...baseResponse,
					})
				);
			});
		});

		describe('when an error occurs', () => {
			it('should return an OAuthProcessDto with error', async () => {
				const errorResponse: OAuthProcessDto = {
					provider: 'unknown-provider',
					errorCode: 'sso_internal_error',
					redirect: 'errorRedirect',
				};
				const { code, query, testSystem } = setup();
				oauthService.checkAuthorizationCode.mockReturnValue(code);
				oauthService.getOAuthErrorResponse.mockReturnValue(errorResponse);
				oauthService.authenticateUser.mockRejectedValue(new OAuthSSOError('Testmessage'));
				systemService.findOAuthById.mockResolvedValue(testSystem);

				const response: OAuthProcessDto = await uc.processOAuth(query, testSystem.id!);

				expect(response).toEqual(errorResponse);
			});
		});
	});
});
