import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AccountService } from '@modules/account/services/account.service';
import { Account } from '@modules/account/domain';
import { OAuthService, OAuthTokenDto } from '@modules/oauth';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { userDoFactory } from '@shared/testing';

import { ICurrentUser, OauthCurrentUser } from '../interface';

import { SchoolInMigrationLoggableException } from '../loggable';

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
				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).buildWithId();
				const account: Account = new Account({
					id: 'accountId',
					createdAt: new Date(),
					updatedAt: new Date(),
					username: 'username',
				});

				const idToken = 'idToken';
				oauthService.authenticateUser.mockResolvedValue(
					new OAuthTokenDto({
						idToken,
						accessToken: 'accessToken',
						refreshToken: 'refreshToken',
					})
				);
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(account);

				return { systemId, user, account, idToken };
			};

			it('should return the ICurrentUser', async () => {
				const { systemId, user, account, idToken } = setup();

				const result: ICurrentUser = await strategy.validate({
					body: { code: 'code', redirectUri: 'redirectUri', systemId },
				});

				expect(result).toEqual<OauthCurrentUser>({
					systemId,
					userId: user.id as EntityId,
					roles: [user.roles[0].id],
					schoolId: user.schoolId,
					accountId: account.id ?? '',
					externalIdToken: idToken,
					isExternalUser: true,
				});
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
				oauthService.provisionUser.mockResolvedValue(null);
			};

			it('should throw a SchoolInMigrationError', async () => {
				setup();

				const func = async () =>
					strategy.validate({ body: { code: 'code', redirectUri: 'redirectUri', systemId: 'systemId' } });

				await expect(func).rejects.toThrow(new SchoolInMigrationLoggableException());
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
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(null);
			};

			it('should throw an UnauthorizedException', async () => {
				setup();

				const func = async () =>
					strategy.validate({
						body: { code: 'code', redirectUri: 'redirectUri', systemId: 'systemId' },
					});

				await expect(func).rejects.toThrow(new UnauthorizedException('no account found'));
			});
		});
	});
});
