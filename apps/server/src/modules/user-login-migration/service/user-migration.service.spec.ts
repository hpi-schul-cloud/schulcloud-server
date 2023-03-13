import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	BadRequestException,
	InternalServerErrorException,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto, AccountSaveDto } from '@src/modules/account/services/dto';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '@src/modules/system';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { UserService } from '@src/modules/user';
import { PageTypes } from '../interface/page-types.enum';
import { PageContentDto } from './dto/page-content.dto';
import { UserMigrationService } from './user-migration.service';

describe('UserMigrationService', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: UserMigrationService;
	let configBefore: IConfig;
	let logger: Logger;

	let schoolService: DeepMocked<SchoolService>;
	let systemService: DeepMocked<SystemService>;
	let userService: DeepMocked<UserService>;
	let accountService: DeepMocked<AccountService>;

	const hostUri = 'http://this.de';
	const apiUrl = 'http://mock.de';
	const s3 = 'sKey123456789123456789';

	beforeAll(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true });
		Configuration.set('HOST', hostUri);
		Configuration.set('PUBLIC_BACKEND_URL', apiUrl);
		Configuration.set('S3_KEY', s3);

		module = await Test.createTestingModule({
			providers: [
				UserMigrationService,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(UserMigrationService);
		schoolService = module.get(SchoolService);
		systemService = module.get(SystemService);
		userService = module.get(UserService);
		accountService = module.get(AccountService);
		logger = module.get(Logger);

		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();

		Configuration.reset(configBefore);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setup = () => {
		const officialSchoolNumber = '3';
		const school: SchoolDO = new SchoolDO({
			name: 'schoolName',
			officialSchoolNumber,
		});

		return {
			officialSchoolNumber,
			school,
		};
	};

	describe('getMigrationConsentPageRedirect is called', () => {
		describe('when finding the migration systems', () => {
			it('should return a url to the migration endpoint', async () => {
				const { school, officialSchoolNumber } = setup();
				const iservSystem: SystemDto = new SystemDto({
					id: 'iservId',
					type: '',
					alias: 'Schulserver',
				});
				const sanisSystem: SystemDto = new SystemDto({
					id: 'sanisId',
					type: '',
					alias: 'SANIS',
				});

				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([iservSystem, sanisSystem]);

				const result: string = await service.getMigrationConsentPageRedirect(officialSchoolNumber, 'iservId');

				expect(result).toEqual(
					'http://this.de/migration?sourceSystem=iservId&targetSystem=sanisId&origin=iservId&mandatory=false'
				);
			});
		});

		describe('when the migration systems have invalid data', () => {
			it('should throw InternalServerErrorException', async () => {
				const { officialSchoolNumber } = setup();
				systemService.findByType.mockResolvedValue([]);

				const promise: Promise<string> = service.getMigrationConsentPageRedirect(
					officialSchoolNumber,
					'unknownSystemId'
				);

				await expect(promise).rejects.toThrow(InternalServerErrorException);
			});
		});
	});

	describe('getMigrationRedirectUri is called', () => {
		describe('when a Redirect-URL for a system is requested', () => {
			it('should return a proper redirect', () => {
				const response = service.getMigrationRedirectUri();

				expect(response).toContain('migration');
			});
		});
	});

	describe('getPageContent is called', () => {
		const setupPageContent = () => {
			const sourceOauthConfig: OauthConfigDto = new OauthConfigDto({
				clientId: 'sourceClientId',
				clientSecret: 'sourceSecret',
				alias: 'alias',
				tokenEndpoint: 'http://source.de/auth/public/mockToken',
				grantType: 'authorization_code',
				scope: 'openid uuid',
				responseType: 'code',
				authEndpoint: 'http://source.de/auth',
				provider: 'source_provider',
				logoutEndpoint: 'source_logoutEndpoint',
				issuer: 'source_issuer',
				jwksEndpoint: 'source_jwksEndpoint',
				redirectUri: 'http://this.de/api/v3/sso/oauth/sourceSystemId',
			});
			const targetOauthConfig: OauthConfigDto = new OauthConfigDto({
				clientId: 'targetClientId',
				clientSecret: 'targetSecret',
				alias: 'alias',
				tokenEndpoint: 'http://target.de/auth/public/mockToken',
				grantType: 'authorization_code',
				scope: 'openid uuid',
				responseType: 'code',
				authEndpoint: 'http://target.de/auth',
				provider: 'target_provider',
				logoutEndpoint: 'target_logoutEndpoint',
				issuer: 'target_issuer',
				jwksEndpoint: 'target_jwksEndpoint',
				redirectUri: 'http://this.de/api/v3/sso/oauth/targetSystemId',
			});
			const sourceSystem: SystemDto = new SystemDto({
				id: 'sourceSystemId',
				type: 'oauth',
				alias: 'Iserv',
				oauthConfig: sourceOauthConfig,
			});
			const targetSystem: SystemDto = new SystemDto({
				id: 'targetSystemId',
				type: 'oauth',
				alias: 'Sanis',
				oauthConfig: targetOauthConfig,
			});

			const migrationRedirectUri = 'http://mock.de/api/v3/sso/oauth/targetSystemId/migration';

			return { sourceSystem, targetSystem, sourceOauthConfig, targetOauthConfig, migrationRedirectUri };
		};

		describe('when coming from the target system', () => {
			it('should return the url to the source system and a frontpage url', async () => {
				const { sourceSystem, targetSystem } = setupPageContent();
				const sourceSystemLoginUrl = `http://mock.de/api/v3/sso/login/sourceSystemId?postLoginRedirect=http%3A%2F%2Fmock.de%2Fapi%2Fv3%2Fsso%2Flogin%2FtargetSystemId%3Fmigration%3Dtrue`;

				systemService.findById.mockResolvedValueOnce(sourceSystem);
				systemService.findById.mockResolvedValueOnce(targetSystem);

				const contentDto: PageContentDto = await service.getPageContent(
					PageTypes.START_FROM_TARGET_SYSTEM,
					sourceSystem.id as string,
					targetSystem.id as string
				);

				expect(contentDto).toEqual<PageContentDto>({
					proceedButtonUrl: sourceSystemLoginUrl,
					cancelButtonUrl: '/login',
				});
			});
		});

		describe('when coming from the source system', () => {
			it('should return the url to the target system and a dashboard url', async () => {
				const { sourceSystem, targetSystem } = setupPageContent();
				const targetSystemLoginUrl = `http://mock.de/api/v3/sso/login/targetSystemId?migration=true`;

				systemService.findById.mockResolvedValueOnce(sourceSystem);
				systemService.findById.mockResolvedValueOnce(targetSystem);

				const contentDto: PageContentDto = await service.getPageContent(
					PageTypes.START_FROM_SOURCE_SYSTEM,
					sourceSystem.id as string,
					targetSystem.id as string
				);

				expect(contentDto).toEqual<PageContentDto>({
					proceedButtonUrl: targetSystemLoginUrl,
					cancelButtonUrl: '/dashboard',
				});
			});
		});

		describe('when coming from the source system and the migration is mandatory', () => {
			it('should return the url to the target system and a logout url', async () => {
				const { sourceSystem, targetSystem } = setupPageContent();
				const targetSystemLoginUrl = `http://mock.de/api/v3/sso/login/targetSystemId?migration=true`;

				systemService.findById.mockResolvedValueOnce(sourceSystem);
				systemService.findById.mockResolvedValueOnce(targetSystem);

				const contentDto: PageContentDto = await service.getPageContent(
					PageTypes.START_FROM_SOURCE_SYSTEM_MANDATORY,
					sourceSystem.id as string,
					targetSystem.id as string
				);

				expect(contentDto).toEqual<PageContentDto>({
					proceedButtonUrl: targetSystemLoginUrl,
					cancelButtonUrl: '/logout',
				});
			});
		});

		describe('when a wrong page type is given', () => {
			it('throws a BadRequestException', async () => {
				const { sourceSystem, targetSystem } = setupPageContent();
				systemService.findById.mockResolvedValueOnce(sourceSystem);
				systemService.findById.mockResolvedValueOnce(targetSystem);

				const promise: Promise<PageContentDto> = service.getPageContent('undefined' as PageTypes, '', '');

				await expect(promise).rejects.toThrow(BadRequestException);
			});
		});

		describe('when a system has no oauth config', () => {
			it('throws a EntityNotFoundError', async () => {
				const { sourceSystem, targetSystem } = setupPageContent();
				sourceSystem.oauthConfig = undefined;
				systemService.findById.mockResolvedValueOnce(sourceSystem);
				systemService.findById.mockResolvedValueOnce(targetSystem);

				const promise: Promise<PageContentDto> = service.getPageContent(
					PageTypes.START_FROM_TARGET_SYSTEM,
					'invalid',
					'invalid'
				);

				await expect(promise).rejects.toThrow(UnprocessableEntityException);
			});
		});
	});

	describe('migrateUser is called', () => {
		beforeEach(() => {
			jest.useFakeTimers();
			jest.setSystemTime(new Date(2020, 1, 1));
		});

		const setupMigrationData = () => {
			const targetSystemId = new ObjectId().toHexString();

			const notMigratedUser: UserDO = new UserDO({
				createdAt: new Date(),
				updatedAt: new Date(),
				email: 'emailMock',
				firstName: 'firstNameMock',
				lastName: 'lastNameMock',
				roleIds: ['roleIdMock'],
				schoolId: 'schoolMock',
				externalId: 'currentUserExternalIdMock',
			});

			const migratedUserDO: UserDO = new UserDO({
				createdAt: new Date(),
				updatedAt: new Date(),
				email: 'emailMock',
				firstName: 'firstNameMock',
				lastName: 'lastNameMock',
				roleIds: ['roleIdMock'],
				schoolId: 'schoolMock',
				externalId: 'externalUserTargetId',
				previousExternalId: 'currentUserExternalIdMock',
				lastLoginSystemChange: new Date(),
			});

			const accountId = new ObjectId().toHexString();
			const userId = new ObjectId().toHexString();
			const sourceSystemId = new ObjectId().toHexString();

			const accountDto: AccountDto = new AccountDto({
				id: accountId,
				updatedAt: new Date(),
				createdAt: new Date(),
				userId,
				username: '',
				systemId: sourceSystemId,
			});

			const migratedAccount: AccountSaveDto = new AccountSaveDto({
				id: accountId,
				updatedAt: new Date(),
				createdAt: new Date(),
				userId,
				username: '',
				systemId: targetSystemId,
			});

			return {
				accountDto,
				migratedUserDO,
				notMigratedUser,
				migratedAccount,
				sourceSystemId,
				targetSystemId,
			};
		};

		describe('when migrate user was successful', () => {
			it('should return to migration succeed page', async () => {
				const { targetSystemId, sourceSystemId, accountDto } = setupMigrationData();
				accountService.findByUserIdOrFail.mockResolvedValue(accountDto);

				const result = await service.migrateUser('userId', 'externalUserTargetId', targetSystemId);

				expect(result.redirect).toStrictEqual(
					`${hostUri}/migration/success?sourceSystem=${sourceSystemId}&targetSystem=${targetSystemId}`
				);
			});

			it('should call methods of migration ', async () => {
				const { migratedUserDO, migratedAccount, targetSystemId, notMigratedUser, accountDto } = setupMigrationData();
				userService.findById.mockResolvedValue(notMigratedUser);
				accountService.findByUserIdOrFail.mockResolvedValue(accountDto);

				await service.migrateUser('userId', 'externalUserTargetId', targetSystemId);

				expect(userService.findById).toHaveBeenCalledWith('userId');
				expect(userService.save).toHaveBeenCalledWith(migratedUserDO);
				expect(accountService.findByUserIdOrFail).toHaveBeenCalledWith('userId');
				expect(accountService.save).toHaveBeenCalledWith(migratedAccount);
			});

			it('should do migration of user', async () => {
				const { migratedUserDO, notMigratedUser, accountDto, targetSystemId } = setupMigrationData();
				userService.findById.mockResolvedValue(notMigratedUser);
				accountService.findByUserIdOrFail.mockResolvedValue(accountDto);

				await service.migrateUser('userId', 'externalUserTargetId', targetSystemId);

				expect(userService.save).toHaveBeenCalledWith(migratedUserDO);
			});

			it('should do migration of account', async () => {
				const { notMigratedUser, accountDto, migratedAccount, targetSystemId } = setupMigrationData();
				userService.findById.mockResolvedValue(notMigratedUser);
				accountService.findByUserIdOrFail.mockResolvedValue(accountDto);

				await service.migrateUser('userId', 'externalUserTargetId', targetSystemId);

				expect(accountService.save).toHaveBeenCalledWith(migratedAccount);
			});
		});

		describe('when migration step failed', () => {
			it('should throw Error', async () => {
				const targetSystemId = new ObjectId().toHexString();
				userService.findById.mockRejectedValue(new NotFoundException('Could not find User'));

				await expect(service.migrateUser('userId', 'externalUserTargetId', targetSystemId)).rejects.toThrow(
					new NotFoundException('Could not find User')
				);
			});

			it('should log error and message', async () => {
				const { migratedUserDO, accountDto, targetSystemId } = setupMigrationData();
				const error = new NotFoundException('Test Error');
				userService.findById.mockResolvedValue(migratedUserDO);
				accountService.findByUserIdOrFail.mockResolvedValue(accountDto);
				accountService.save.mockRejectedValueOnce(error);

				await service.migrateUser('userId', 'externalUserTargetId', targetSystemId);

				expect(logger.log).toHaveBeenCalledWith(
					expect.objectContaining({
						message: 'This error occurred during migration of User:',
						affectedUserId: 'userId',
						error,
					})
				);
			});

			it('should do a rollback of migration', async () => {
				const { notMigratedUser, accountDto, targetSystemId } = setupMigrationData();
				const error = new NotFoundException('Test Error');
				userService.findById.mockResolvedValue(notMigratedUser);
				accountService.findByUserIdOrFail.mockResolvedValue(accountDto);
				accountService.save.mockRejectedValueOnce(error);

				await service.migrateUser('userId', 'externalUserTargetId', targetSystemId);

				expect(userService.save).toHaveBeenCalledWith(notMigratedUser);
				expect(accountService.save).toHaveBeenCalledWith(accountDto);
			});

			it('should return to dashboard', async () => {
				const { migratedUserDO, accountDto, targetSystemId, sourceSystemId } = setupMigrationData();
				const error = new NotFoundException('Test Error');
				userService.findById.mockResolvedValue(migratedUserDO);
				accountService.findByUserIdOrFail.mockResolvedValue(accountDto);
				accountService.save.mockRejectedValueOnce(error);

				const result = await service.migrateUser('userId', 'externalUserTargetId', targetSystemId);

				expect(result.redirect).toStrictEqual(
					`${hostUri}/migration/error?sourceSystem=${sourceSystemId}&targetSystem=${targetSystemId}`
				);
			});
		});
	});
});
