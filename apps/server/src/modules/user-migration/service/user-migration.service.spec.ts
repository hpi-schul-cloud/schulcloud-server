import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing';
import { BadRequestException } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { SystemService } from '@src/modules/system/service';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { UserMigrationService } from './user-migration.service';
import { PageContentDto } from './dto/page-content.dto';
import { PageTypes } from '../interface/page-types.enum';

describe('MigrationService', () => {
	let module: TestingModule;
	let service: UserMigrationService;
	let systemService: DeepMocked<SystemService>;
	let orm: MikroORM;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				UserMigrationService,
			],
		}).compile();
		systemService = module.get(SystemService);
		service = module.get(UserMigrationService);
		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	const setup = () => {
		const defaultOauthConfigDto: OauthConfigDto = new OauthConfigDto({
			clientId: '12345',
			clientSecret: 'mocksecret',
			tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
			grantType: 'authorization_code',
			scope: 'openid uuid',
			responseType: 'code',
			authEndpoint: 'http://mock.de/mock/auth',
			provider: 'mock_provider',
			logoutEndpoint: 'mock_logoutEndpoint',
			issuer: 'mock_issuer',
			jwksEndpoint: 'mock_jwksEndpoint',
			redirectUri: 'http://mock.de/mock/redirect',
		});
		const mockSystem: SystemDto = new SystemDto({
			type: 'oauth',
			url: 'http://mockhost:3030/api/v3/oauth',
			alias: 'Iserv',
			oauthConfig: defaultOauthConfigDto,
		});

		const proceedUrl =
			'http://mock.de/mock/auth?client_id=12345&redirect_uri=http%3A%2F%2Fmock.de%2Fmock%2Fredirect&response_type=code&scope=openid+uuid';

		return { mockSystem, proceedUrl };
	};

	describe('getPageContent is called', () => {
		describe('when the pagecontent for different keys is called', () => {
			let mockSystem: SystemDto;
			let proceedUrl: string;
			beforeEach(() => {
				const setupObjects = setup();
				mockSystem = setupObjects.mockSystem;
				proceedUrl = setupObjects.proceedUrl;
				systemService.findById.mockResolvedValue(mockSystem);
			});
			it('is requested for TARGET_SYSTEM', async () => {
				proceedUrl =
					'http://mock.de/mock/auth?client_id=12345&redirect_uri=http%3A%2F%2Fmock.de%2Fmock%2Fredirect%3FpostLoginRedirect%3Dhttp%253A%252F%252Fmock.de%252Fmock%252Fauth%253Fclient_id%253D12345%2526redirect_uri%253Dhttp%25253A%25252F%25252Fmock.de%25252Fmock%25252Fredirect%25253FpostLoginRedirect%25253D%2525252Fapi%2525252Fv3%2525252Foauth%2525252Fmigration%2526response_type%253Dcode%2526scope%253Dopenid%252Buuid&response_type=code&scope=openid+uuid';

				const contentDto: PageContentDto = await service.getPageContent(
					PageTypes.START_FROM_TARGET_SYSTEM,
					'source',
					'target'
				);

				expect(contentDto).toEqual<PageContentDto>({
					proceedButtonUrl: proceedUrl,
					cancelButtonUrl: '/login',
				});
			});
			it('is requested for SOURCE_SYSTEM', async () => {
				const contentDto: PageContentDto = await service.getPageContent(
					PageTypes.START_FROM_SOURCE_SYSTEM,
					'source',
					'target'
				);
				expect(contentDto).toEqual<PageContentDto>({
					proceedButtonUrl: proceedUrl,
					cancelButtonUrl: '/dashboard',
				});
			});
			it('is requested for SOURCE_SYSTEM_MANDATORY', async () => {
				const contentDto: PageContentDto = await service.getPageContent(
					PageTypes.START_FROM_SOURCE_SYSTEM_MANDATORY,
					'source',
					'target'
				);
				expect(contentDto).toEqual<PageContentDto>({
					proceedButtonUrl: proceedUrl,
					cancelButtonUrl: '/logout',
				});
			});
			it('throws an exception without a type', async () => {
				const promise: Promise<PageContentDto> = service.getPageContent('undefined' as PageTypes, '', '');

				await expect(promise).rejects.toThrow(BadRequestException);
			});
			it('throws an exception without oauthconfig', async () => {
				mockSystem.oauthConfig = undefined;
				systemService.findById.mockResolvedValue(mockSystem);

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
