import { Test, TestingModule } from '@nestjs/testing';
import { SystemRepo } from '@shared/repo';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities, systemFactory } from '@shared/testing';
import { System } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
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
				MigrationService,
				{
					provide: SystemRepo,
					useValue: createMock<SystemRepo>(),
				},
			],
		}).compile();
		service = module.get(MigrationService);
		systemRepo = module.get(SystemRepo);
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
		let loginString: string;
		beforeAll(() => {
			mockSystem = systemFactory.withOauthConfig().build();
			systemRepo.findById.mockResolvedValue(mockSystem);
		});
		it('is requested for NEW_SYSTEM', async () => {
			const contentDto: PageContentDto = await service.getPageContent(
				PageTypes.START_FROM_NEW_SYSTEM,
				'source',
				'target'
			);

			expect(contentDto.cancelButtonUrl).toEqual('mockHost/logout');
		});
	});
});
