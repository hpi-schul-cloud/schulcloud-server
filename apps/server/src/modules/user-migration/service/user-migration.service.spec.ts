import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { MikroORM } from '@mikro-orm/core';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { accountFactory, setupEntities } from '@shared/testing';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '@src/modules/system';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { UserService } from '@src/modules/user';
import { ObjectId } from '@mikro-orm/mongodb';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { AccountDto } from '@src/modules/account/services/dto';
import { Logger } from '@src/core/logger';
import { AccountService } from '@src/modules/account/services/account.service';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { PageTypes } from '../interface/page-types.enum';
import { PageContentDto } from './dto/page-content.dto';
import { UserMigrationService } from './user-migration.service';

describe('UserMigrationService', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: UserMigrationService;
	let configBefore: IConfig;

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

		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();

		Configuration.reset(configBefore);
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

	describe('isSchoolInMigration is called', () => {
		describe('when the migration is possible', () => {
			it('should return true', async () => {
				const { school, officialSchoolNumber } = setup();
				school.oauthMigrationPossible = new Date();

				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);

				const result: boolean = await service.isSchoolInMigration(officialSchoolNumber);

				expect(result).toEqual(true);
			});
		});

		describe('when the migration is mandatory', () => {
			it('should return true', async () => {
				const { school, officialSchoolNumber } = setup();
				school.oauthMigrationMandatory = new Date();

				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);

				const result: boolean = await service.isSchoolInMigration(officialSchoolNumber);

				expect(result).toEqual(true);
			});
		});

		describe('when there is no school with this official school number', () => {
			it('should return false', async () => {
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(null);

				const result: boolean = await service.isSchoolInMigration('unknown number');

				expect(result).toEqual(false);
			});
		});
	});

	describe('getMigrationRedirect is called', () => {
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
				systemService.findOAuth.mockResolvedValue([iservSystem, sanisSystem]);

				const result: string = await service.getMigrationRedirect(officialSchoolNumber, 'iservId');

				expect(result).toEqual(
					'http://this.de/migration?sourceSystem=iservId&targetSystem=sanisId&origin=iservId&mandatory=false'
				);
			});
		});

		describe('when the migration systems have invalid data', () => {
			it('should throw InternalServerErrorException', async () => {
				const { officialSchoolNumber } = setup();
				systemService.findOAuth.mockResolvedValue([]);

				const promise: Promise<string> = service.getMigrationRedirect(officialSchoolNumber, 'unknownSystemId');

				await expect(promise).rejects.toThrow(InternalServerErrorException);
			});
		});
	});

	describe('getPageContent is called', () => {
		const setupPageContent = () => {
			const sourceOauthConfig: OauthConfigDto = new OauthConfigDto({
				clientId: 'sourceClientId',
				clientSecret: 'sourceSecret',
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
				const { sourceSystem, targetSystem, sourceOauthConfig, migrationRedirectUri } = setupPageContent();
				const targetSystemLoginUrl = `http://target.de/auth?client_id=targetClientId&redirect_uri=${encodeURIComponent(
					migrationRedirectUri
				)}&response_type=code&scope=openid+uuid`;
				const redirectUrl = `${sourceOauthConfig.redirectUri}?postLoginRedirect=${encodeURIComponent(
					targetSystemLoginUrl
				)}`;
				const sourceSystemLoginUrl = `http://source.de/auth?client_id=sourceClientId&redirect_uri=${encodeURIComponent(
					redirectUrl
				)}&response_type=code&scope=openid+uuid`;

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
				const { sourceSystem, targetSystem, migrationRedirectUri } = setupPageContent();
				const targetSystemLoginUrl = `http://target.de/auth?client_id=targetClientId&redirect_uri=${encodeURIComponent(
					migrationRedirectUri
				)}&response_type=code&scope=openid+uuid`;

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
				const { sourceSystem, targetSystem, migrationRedirectUri } = setupPageContent();
				const targetSystemLoginUrl = `http://target.de/auth?client_id=targetClientId&redirect_uri=${encodeURIComponent(
					migrationRedirectUri
				)}&response_type=code&scope=openid+uuid`;

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

				await expect(promise).rejects.toThrow(EntityNotFoundError);
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

			const id = new ObjectId().toHexString();
			const userId = new ObjectId().toHexString();
			const systemId = new ObjectId().toHexString();

			const accountDto = accountFactory.buildWithId(
				{
					userId,
					username: '',
					systemId,
				},
				id
			) as AccountDto;

			const migratedAccount = accountFactory.buildWithId(
				{
					userId,
					username: '',
					systemId: targetSystemId,
				},
				id
			);

			return {
				accountDto,
				migratedUserDO,
				notMigratedUser,
				migratedAccount,
				targetSystemId,
			};
		};

		describe('when migrate user was successful', () => {
			it('should return to migration succeed page', async () => {
				const { targetSystemId } = setupMigrationData();

				const result = await service.migrateUser('userId', 'externalUserTargetId', targetSystemId);

				expect(result.redirect).toStrictEqual(`${hostUri}/migration/succeed`);
			});

			it('should call methods of migration ', async () => {
				const { migratedUserDO, migratedAccount, targetSystemId } = setupMigrationData();

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
				const { migratedUserDO, accountDto, targetSystemId } = setupMigrationData();
				const error = new NotFoundException('Test Error');
				userService.findById.mockResolvedValue(migratedUserDO);
				accountService.findByUserIdOrFail.mockResolvedValue(accountDto);
				accountService.save.mockRejectedValueOnce(error);

				const result = await service.migrateUser('userId', 'externalUserTargetId', targetSystemId);

				expect(result.redirect).toStrictEqual(`${hostUri}/dashboard`);
			});
		});
	});
});
