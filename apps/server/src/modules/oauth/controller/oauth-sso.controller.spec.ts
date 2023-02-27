import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { getMockRes } from '@jest-mock/express';
import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { HydraOauthUc } from '@src/modules/oauth/uc/hydra-oauth.uc';
import { Request } from 'express';
import { MigrationDto } from '@src/modules/user-login-migration/service/dto/migration.dto';
import { OAuthProcessDto } from '../service/dto/oauth-process.dto';
import { OauthUc } from '../uc';
import { StatelessAuthorizationParams } from './dto/stateless-authorization.params';
import { OauthSSOController } from './oauth-sso.controller';

describe('OAuthController', () => {
	let module: TestingModule;
	let controller: OauthSSOController;
	let hydraOauthUc: DeepMocked<HydraOauthUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [OauthSSOController],
			providers: [
				{
					provide: OauthUc,
					useValue: createMock<OauthUc>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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

	describe('migrateUser', () => {
		const migrationSetup = () => {
			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

			const { res } = getMockRes();

			const query: AuthorizationParams = new AuthorizationParams();
			query.code = 'defaultAuthCode';

			const systemParams: SystemUrlParams = new SystemUrlParams();
			systemParams.systemId = 'systemId';

			return {
				currentUser,
				res,
				query,
				systemParams,
			};
		};

		describe('when migration was successful ', () => {
			it('should redirect to migration succeed page ', async () => {
				const { currentUser, res, query, systemParams } = migrationSetup();
				oauthUc.migrate.mockResolvedValue({ redirect: `${mockHost}/migration/succeed` });

				await controller.migrateUser(currentUser, query, res, systemParams);

				expect(res.redirect).toHaveBeenCalledWith(`${mockHost}/migration/succeed`);
			});
		});

		describe('when migration failed ', () => {
			it('should redirect to dashboard ', async () => {
				const { currentUser, res, query, systemParams } = migrationSetup();
				oauthUc.migrate.mockResolvedValue({ redirect: `${mockHost}/dashboard` });

				await controller.migrateUser(currentUser, query, res, systemParams);

				expect(res.redirect).toHaveBeenCalledWith(`${mockHost}/dashboard`);
			});
		});

		describe('when migration redirect is not given ', () => {
			it('should throw InternalServerErrorException ', async () => {
				const { currentUser, res, query, systemParams } = migrationSetup();
				oauthUc.migrate.mockResolvedValue(new MigrationDto({}));

				await expect(controller.migrateUser(currentUser, query, res, systemParams)).rejects.toThrow(
					new InternalServerErrorException(
						`Migration of ${currentUser.userId} to system ${systemParams.systemId} failed.`
					)
				);
			});
		});
	});
});
