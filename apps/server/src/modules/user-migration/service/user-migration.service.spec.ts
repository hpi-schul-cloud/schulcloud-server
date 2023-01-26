import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { MikroORM } from '@mikro-orm/core';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { setupEntities } from '@shared/testing';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '@src/modules/system';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { PageTypes } from '../interface/page-types.enum';
import { PageContentDto } from './dto/page-content.dto';
import { UserMigrationService } from './user-migration.service';

describe('UserMigrationService', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: UserMigrationService;

	let schoolService: DeepMocked<SchoolService>;
	let systemService: DeepMocked<SystemService>;

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockReturnValue('http://this.de');

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
			],
		}).compile();

		service = module.get(UserMigrationService);
		schoolService = module.get(SchoolService);
		systemService = module.get(SystemService);

		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
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

			const migrationRedirect = 'http://this.de/api/v3/sso/oauth/targetSystemId/migration';

			return { sourceSystem, targetSystem, sourceOauthConfig, targetOauthConfig, migrationRedirect };
		};

		describe('when coming from the target system', () => {
			it('should return the url to the source system and a frontpage url', async () => {
				const { sourceSystem, targetSystem, sourceOauthConfig, migrationRedirect } = setupPageContent();
				const targetSystemLoginUrl = `http://target.de/auth?client_id=targetClientId&redirect_uri=${encodeURIComponent(
					migrationRedirect
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
				const { sourceSystem, targetSystem, migrationRedirect } = setupPageContent();
				const targetSystemLoginUrl = `http://target.de/auth?client_id=targetClientId&redirect_uri=${encodeURIComponent(
					migrationRedirect
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
				const { sourceSystem, targetSystem, migrationRedirect } = setupPageContent();
				const targetSystemLoginUrl = `http://target.de/auth?client_id=targetClientId&redirect_uri=${encodeURIComponent(
					migrationRedirect
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
});
