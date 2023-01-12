import { Test, TestingModule } from '@nestjs/testing';
import { SystemRepo } from '@shared/repo';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities, systemFactory } from '@shared/testing';
import { System } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { BadRequestException } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { MigrationService } from './migration.service';
import { PageTypes } from '../controller/dto/page-type.query.param';
import { PageContentDto } from './dto/page-content.dto';

describe('MigrationService', () => {
	let module: TestingModule;
	let service: MigrationService;
	let systemRepo: DeepMocked<SystemRepo>;
	let orm: MikroORM;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: SystemRepo,
					useValue: createMock<SystemRepo>(),
				},
				MigrationService,
			],
		}).compile();
		systemRepo = module.get(SystemRepo);
		service = module.get(MigrationService);
		orm = await setupEntities();

		jest.spyOn(Configuration, 'get').mockImplementation((key: string) => {
			switch (key) {
				case 'HOST':
					return 'mockHost';
				default:
					return 'nonexistent case';
			}
		});
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	describe('when the pagecontent for different keys is called', () => {
		let mockSystem: System;
		beforeEach(() => {
			mockSystem = systemFactory.withOauthConfig().build();
			systemRepo.findById.mockResolvedValue(mockSystem);
		});
		afterEach(() => {
			systemRepo.findById.mockRestore();
		});
		it('is requested for NEW_SYSTEM', async () => {
			const contentDto: PageContentDto = await service.getPageContent(
				PageTypes.START_FROM_NEW_SYSTEM,
				'source',
				'target'
			);
			expect(contentDto.cancelButtonUrl).toEqual('mockHost/logout');
		});
		it('is requested for OLD_SYSTEM', async () => {
			const contentDto: PageContentDto = await service.getPageContent(
				PageTypes.START_FROM_OLD_SYSTEM,
				'source',
				'target'
			);
			expect(contentDto.cancelButtonUrl).toEqual('mockHost/dashboard');
		});
		it('is requested for OLD_SYSTEM_MANDATORY', async () => {
			const contentDto: PageContentDto = await service.getPageContent(
				PageTypes.START_FROM_OLD_SYSTEM_MANDATORY,
				'source',
				'target'
			);
			expect(contentDto.cancelButtonUrl).toEqual('mockHost/logout');
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
