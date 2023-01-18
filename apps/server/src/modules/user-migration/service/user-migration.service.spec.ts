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

		return { mockSystem };
	};

	describe('when the pagecontent for different keys is called', () => {
		describe('getPageContent is called', () => {
			beforeEach(() => {
				const { mockSystem } = setup();
				systemService.findById.mockResolvedValue(mockSystem);
			});
			it('is requested for NEW_SYSTEM', async () => {
				const contentDto: PageContentDto = await service.getPageContent(
					PageTypes.START_FROM_TARGET_SYSTEM,
					'source',
					'target'
				);
				expect(contentDto.proceedButtonUrl).toContain('http://mock.de');
				expect(contentDto.cancelButtonUrl).toEqual('/login');
			});
			it('is requested for OLD_SYSTEM', async () => {
				const contentDto: PageContentDto = await service.getPageContent(
					PageTypes.START_FROM_SOURCE_SYSTEM,
					'source',
					'target'
				);
				expect(contentDto.proceedButtonUrl).toContain('http://mock.de');
				expect(contentDto.cancelButtonUrl).toEqual('/dashboard');
			});
			it('is requested for OLD_SYSTEM_MANDATORY', async () => {
				const contentDto: PageContentDto = await service.getPageContent(
					PageTypes.START_FROM_SOURCE_SYSTEM_MANDATORY,
					'source',
					'target'
				);
				expect(contentDto.proceedButtonUrl).toContain('http://mock.de');
				expect(contentDto.cancelButtonUrl).toEqual('/logout');
			});
			it('throws an exception without a type', async () => {
				const promise: Promise<PageContentDto> = service.getPageContent('undefined' as PageTypes, '', '');

				await expect(promise).rejects.toThrow(BadRequestException);
			});
			it('throws an exception without oauthconfig', async () => {
				const { mockSystem } = setup();
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
