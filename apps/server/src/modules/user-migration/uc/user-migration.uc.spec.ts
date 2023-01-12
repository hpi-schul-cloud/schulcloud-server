import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UserMigrationUc } from './user-migration.uc';
import { UserMigrationService } from '../service/user-migration.service';
import { PageContentMapper } from '../mapper/page-content.mapper';
import { PageContentResponse } from '../controller/dto/page-content.response';
import { PageContentDto } from '../service/dto/page-content.dto';
import { PageTypes } from '../interface/page-types.enum';

describe('MigrationUc', () => {
	let module: TestingModule;
	let uc: UserMigrationUc;
	let service: DeepMocked<UserMigrationService>;
	let mapper: DeepMocked<PageContentMapper>;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserMigrationUc,
				{
					provide: UserMigrationService,
					useValue: createMock<UserMigrationService>(),
				},
				{
					provide: PageContentMapper,
					useValue: createMock<PageContentMapper>(),
				},
			],
		}).compile();
		uc = module.get(UserMigrationUc);
		service = module.get(UserMigrationService);
		mapper = module.get(PageContentMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when it should get page-content', () => {
		let response: PageContentResponse;
		let dto: PageContentDto;
		beforeAll(() => {
			dto = {
				proceedButtonUrl: 'proceed',
				cancelButtonUrl: 'cancel',
			};
			response = {
				proceedButtonUrl: 'proceed',
				cancelButtonUrl: 'cancel',
			};
			service.getPageContent.mockResolvedValue(dto);
			mapper.mapDtoToResponse.mockReturnValue(response);
		});
		it('should return a response', async () => {
			const testResp = await uc.getPageContent(PageTypes.START_FROM_NEW_SYSTEM, 'source', 'target');
			expect(testResp).toEqual(response);
		});
	});
});
