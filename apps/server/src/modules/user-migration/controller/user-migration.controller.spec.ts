import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UserMigrationUc } from '../uc/user-migration.uc';
import { UserMigrationController } from './user-migration.controller';
import { PageContentQueryParams } from './dto/page-type.query.param';
import { PageContentResponse } from './dto/page-content.response';
import { PageTypes } from '../interface/page-types.enum';
import { PageContentDto } from '../service/dto/page-content.dto';
import { PageContentMapper } from '../mapper/page-content.mapper';

describe('MigrationController', () => {
	let module: TestingModule;
	let controller: UserMigrationController;
	let uc: DeepMocked<UserMigrationUc>;
	let mapper: DeepMocked<PageContentMapper>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: UserMigrationUc,
					useValue: createMock<UserMigrationUc>(),
				},
				{
					provide: PageContentMapper,
					useValue: createMock<PageContentMapper>(),
				},
			],
			controllers: [UserMigrationController],
		}).compile();

		controller = module.get(UserMigrationController);
		uc = module.get(UserMigrationUc);
		mapper = module.get(PageContentMapper);
	});
	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('when pagecontent is requested', () => {
		let query: PageContentQueryParams;
		let response: PageContentResponse;
		let dto: PageContentDto;
		beforeAll(() => {
			query = {
				pageType: PageTypes.START_FROM_NEW_SYSTEM,
				sourceSystem: 'source',
				targetSystem: 'target',
			};
			dto = new PageContentDto({
				proceedButtonUrl: 'proceedUrl',
				cancelButtonUrl: 'cancelUrl',
			});
			response = new PageContentResponse({
				proceedButtonUrl: 'proceedUrl',
				cancelButtonUrl: 'cancelUrl',
			});
			mapper.mapDtoToResponse.mockReturnValue(response);
			uc.getPageContent.mockResolvedValue(dto);
		});
		it('should return a response', async () => {
			const testResp: PageContentResponse = await controller.getMigrationPageDetails(query);
			expect(uc.getPageContent).toHaveBeenCalled();
			expect(testResp).toEqual(response);
		});
	});
});
