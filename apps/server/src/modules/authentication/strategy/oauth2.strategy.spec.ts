import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { userDoFactory } from '@shared/testing';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto';
import { OAuthTokenDto } from '@src/modules/oauth';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { SchoolInMigrationError } from '../errors/school-in-migration.error';
import { ICurrentUser } from '../interface';
import { Oauth2Strategy } from './oauth2.strategy';

describe('Oauth2Strategy', () => {
	let module: TestingModule;
	let strategy: Oauth2Strategy;

	let accountService: DeepMocked<AccountService>;
	let oauthService: DeepMocked<OAuthService>;

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
				const systemId: EntityId = 'systemId';
				const user: UserDO = userDoFactory.buildWithId();
				const account: AccountDto = new AccountDto({
					id: 'accountId',
					createdAt: new Date(),
					updatedAt: new Date(),
					username: 'username',
				});

				oauthService.authenticateUser.mockResolvedValue(
					new OAuthTokenDto({
						idToken: 'idToken',
						accessToken: 'accessToken',
						refreshToken: 'refreshToken',
					})
				);
				oauthService.provisionUser.mockResolvedValue({ user, redirect: '' });
				accountService.findByUserId.mockResolvedValue(account);

				return { systemId, user, account };
			};

			it('should return the ICurrentUser', async () => {
				const { systemId, user, account } = setup();

				const result: ICurrentUser = await strategy.validate({
					body: { error: 'error', redirectUri: 'redirectUri', systemId },
				});

				expect(result).toEqual<ICurrentUser>({
					systemId,
					userId: user.id as EntityId,
					roles: user.roleIds,
					schoolId: user.schoolId,
					accountId: account.id,
				});
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

			it('should throw a SchoolInMigrationError', async () => {
				setup();

				const func = async () =>
					strategy.validate({ body: { code: 'code', redirectUri: 'redirectUri', systemId: 'systemId' } });

				await expect(func).rejects.toThrow(new SchoolInMigrationError());
			});
		});

		describe('when no account was found', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();

				oauthService.authenticateUser.mockResolvedValue(
					new OAuthTokenDto({
						idToken: 'idToken',
						accessToken: 'accessToken',
						refreshToken: 'refreshToken',
					})
				);
				oauthService.provisionUser.mockResolvedValue({ user, redirect: '' });
				accountService.findByUserId.mockResolvedValue(null);
			};

			it('should throw an UnauthorizedException', async () => {
				setup();

				const func = async () =>
					strategy.validate({
						body: { error: 'error', redirectUri: 'redirectUri', systemId: 'systemId' },
					});

				await expect(func).rejects.toThrow(new UnauthorizedException('no account found'));
			});
		});
	});
});
