import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { HydraOauthUc } from '@src/modules/oauth/uc/hydra-oauth.uc';
import { Request } from 'express';
import { ICurrentUser } from '@src/modules/authentication';
import { OauthSSOController } from './oauth-sso.controller';
import { StatelessAuthorizationParams } from './dto/stateless-authorization.params';
import { OauthUc } from '../uc';

describe('OAuthController', () => {
	let module: TestingModule;
	let controller: OauthSSOController;
	let hydraOauthUc: DeepMocked<HydraOauthUc>;

	const mockHost = 'https://mock.de';
	const dateNow: Date = new Date('2020-01-01T00:00:00.000Z');
	const dateExpires: Date = new Date('2020-01-02T00:00:00.000Z');
	const cookieProperties = {
		expires: dateExpires,
		httpOnly: false,
		sameSite: 'lax',
		secure: false,
	};

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string) => {
			switch (key) {
				case 'HOST':
					return mockHost;
				case 'COOKIE__HTTP_ONLY':
					return cookieProperties.httpOnly;
				case 'COOKIE__SAME_SITE':
					return cookieProperties.sameSite;
				case 'COOKIE__SECURE':
					return cookieProperties.secure;
				case 'COOKIE__EXPIRES_SECONDS':
					return 86400000; // One day in ms
				default:
					return 'nonexistent case';
			}
		});
		jest.useFakeTimers();
		jest.setSystemTime(dateNow);

		module = await Test.createTestingModule({
			controllers: [OauthSSOController],
			providers: [
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: OauthUc,
					useValue: createMock<OauthUc>(),
				},
				{
					provide: HydraOauthUc,
					useValue: createMock<HydraOauthUc>(),
				},
			],
		}).compile();

		controller = module.get(OauthSSOController);
		hydraOauthUc = module.get(HydraOauthUc);
	});

	afterAll(async () => {
		await module.close();
		jest.useRealTimers();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getHydraOauthToken', () => {
		it('should call the hydraOauthUc', async () => {
			const authParams: StatelessAuthorizationParams = {
				code: 'code',
			};
			const oauthClientId = 'clientId';

			await controller.getHydraOauthToken(authParams, oauthClientId);

			expect(hydraOauthUc.getOauthToken).toBeCalledWith(oauthClientId, authParams.code, authParams.error);
		});
	});

	describe('requestAuthToken', () => {
		const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
		const oauthClientId = 'clientId';

		it('should call the hydraOauthUc', async () => {
			const request: Request = {
				headers: { authorization: 'Bearer token123' },
			} as Request;

			await controller.requestAuthToken(currentUser, request, oauthClientId);

			expect(hydraOauthUc.requestAuthCode).toBeCalledWith(currentUser.userId, expect.any(String), oauthClientId);
		});

		it('should throw UnauthorizedException', async () => {
			const request: Request = {
				headers: { authorization: '1551 token123' },
			} as Request;

			await expect(controller.requestAuthToken(currentUser, request, '')).rejects.toThrow(UnauthorizedException);
		});
	});
});
