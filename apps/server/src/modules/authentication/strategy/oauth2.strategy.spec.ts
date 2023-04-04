import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { userDoFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto';
import { OAuthTokenDto } from '@src/modules/oauth';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { RoleService } from '../../role';
import { ICurrentUser } from '../interface';
import { OauthAuthorizationParams } from './dtos/oauth-authorization.params';
import { Oauth2Strategy } from './oauth2.strategy';
import { SchoolInMigrationError } from '../errors/school-in-migration.error';

describe('Oauth2Strategy', () => {
	let module: TestingModule;
	let strategy: Oauth2Strategy;

	let accountService: DeepMocked<AccountService>;
	let oauthService: DeepMocked<OAuthService>;
	let roleService: DeepMocked<RoleService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [
				Oauth2Strategy,
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
			],
		}).compile();

		strategy = module.get(Oauth2Strategy);
		accountService = module.get(AccountService);
		oauthService = module.get(OAuthService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('validate', () => {
		describe('when a valid code is provided', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();

				oauthService.authenticateUser.mockResolvedValue(
					new OAuthTokenDto({
						idToken: 'idToken',
						accessToken: 'accessToken',
						refreshToken: 'refreshToken',
					})
				);
				oauthService.provisionUser.mockReturnValue({ user, redirect: '' });
			};

			it('should throw an UnauthorizedException', async () => {
				setup();

				const func = async () =>
					strategy.validate({ body: { error: 'error', redirectUri: 'redirectUri', systemId: 'systemId' } });

				await expect(func).rejects.toThrow(new UnauthorizedException('error in body'));
			});
		});

		describe('when an error is provided', () => {
			const setup = () => {
				oauthService.authenticateUser.mockRejectedValue(new UnauthorizedException('error in body'));
			};

			it('should throw an UnauthorizedException', async () => {
				setup();

				const func = async () =>
					strategy.validate({ body: { error: 'error', redirectUri: 'redirectUri', systemId: 'systemId' } });

				await expect(func).rejects.toThrow(new UnauthorizedException('error in body'));
			});
		});

		describe('when the user can not be provisioned', () => {
			const setup = () => {
				oauthService.authenticateUser.mockResolvedValue(
					new OAuthTokenDto({
						idToken: 'idToken',
						accessToken: 'accessToken',
						refreshToken: 'refreshToken',
					})
				);
				oauthService.provisionUser.mockResolvedValue({ user: undefined, redirect: '' });
			};

			it('should throw an UnauthorizedException', async () => {
				setup();

				const func = async () =>
					strategy.validate({ body: { code: 'code', redirectUri: 'redirectUri', systemId: 'systemId' } });

				await expect(func).rejects.toThrow(new SchoolInMigrationError());
			});
		});
	});
});
