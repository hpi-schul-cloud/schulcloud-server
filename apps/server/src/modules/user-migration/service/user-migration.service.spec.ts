import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing';
import { BadRequestException } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { SystemService } from '@src/modules/system/service';
import { UserMigrationService } from './user-migration.service';
import { PageContentDto } from './dto/page-content.dto';
import { PageTypes } from '../interface/page-types.enum';
import { SystemDto } from '../../system/service/dto/system.dto';
import { OauthConfigDto } from '../../system/service/dto/oauth-config.dto';

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

	describe('when the pagecontent for different keys is called', () => {
		let mockSystem: SystemDto;
		beforeEach(() => {
			const defaultOauthConfigDto = new OauthConfigDto({
				clientId: '12345',
				clientSecret: 'mocksecret',
				tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
				grantType: 'authorization_code',
				scope: 'openid uuid',
				responseType: 'code',
				authEndpoint: 'mock_authEndpoint',
				provider: 'mock_provider',
				logoutEndpoint: 'mock_logoutEndpoint',
				issuer: 'mock_issuer',
				jwksEndpoint: 'mock_jwksEndpoint',
				redirectUri: 'mock_codeRedirectUri',
			});
			mockSystem = new SystemDto({
				type: 'oauth',
				url: 'http://mockhost:3030/api/v3/oauth',
				alias: 'Iserv',
				oauthConfig: defaultOauthConfigDto,
			});
			systemService.findById.mockResolvedValue(mockSystem);
		});
		afterEach(() => {
			systemService.findById.mockRestore();
		});
		it('is requested for NEW_SYSTEM', async () => {
			const contentDto: PageContentDto = await service.getPageContent(
				PageTypes.START_FROM_NEW_SYSTEM,
				'source',
				'target'
			);
			expect(contentDto.cancelButtonUrl).toEqual('/login');
		});
		it('is requested for OLD_SYSTEM', async () => {
			const contentDto: PageContentDto = await service.getPageContent(
				PageTypes.START_FROM_OLD_SYSTEM,
				'source',
				'target'
			);
			expect(contentDto.cancelButtonUrl).toEqual('/dashboard');
		});
		it('is requested for OLD_SYSTEM_MANDATORY', async () => {
			const contentDto: PageContentDto = await service.getPageContent(
				PageTypes.START_FROM_OLD_SYSTEM_MANDATORY,
				'source',
				'target'
			);
			expect(contentDto.cancelButtonUrl).toEqual('/logout');
		});
		it('throws an exception without a type', async () => {
			await expect(service.getPageContent('undefined' as PageTypes, '', '')).rejects.toThrow(BadRequestException);
		});
		it('throws an exception without oauthconfig', async () => {
			mockSystem.oauthConfig = undefined;
			await expect(service.getPageContent(PageTypes.START_FROM_NEW_SYSTEM, 'invalid', 'invalid')).rejects.toThrow(
				EntityNotFoundError
			);
		});
	});
});
