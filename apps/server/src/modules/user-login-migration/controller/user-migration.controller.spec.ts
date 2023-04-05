import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MigrationUc } from '../uc/migration.uc';
import { UserMigrationController } from './user-migration.controller';
import { PageContentResponse } from './dto/response/page-content.response';
import { PageTypes } from '../interface/page-types.enum';
import { PageContentDto } from '../service/dto/page-content.dto';
import { PageContentMapper } from '../mapper/page-content.mapper';
import { PageContentQueryParams } from './dto/request/page-type.query.param';

describe('MigrationController', () => {
	let module: TestingModule;
	let controller: UserMigrationController;
	let uc: DeepMocked<MigrationUc>;
	let mapper: DeepMocked<PageContentMapper>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: MigrationUc,
					useValue: createMock<MigrationUc>(),
				},
				{
					provide: PageContentMapper,
					useValue: createMock<PageContentMapper>(),
				},
			],
			controllers: [UserMigrationController],
		}).compile();

		controller = module.get(UserMigrationController);
		uc = module.get(MigrationUc);
		mapper = module.get(PageContentMapper);
	});
	afterAll(async () => {
		await module.close();
	});

	const setup = () => {
		const query: PageContentQueryParams = {
			pageType: PageTypes.START_FROM_TARGET_SYSTEM,
			sourceSystem: 'source',
			targetSystem: 'target',
		};
		const dto: PageContentDto = new PageContentDto({
			proceedButtonUrl: 'proceedUrl',
			cancelButtonUrl: 'cancelUrl',
		});
		const response: PageContentResponse = new PageContentResponse({
			proceedButtonUrl: 'proceedUrl',
			cancelButtonUrl: 'cancelUrl',
		});
		return { query, dto, response };
	};

	describe('getMigrationPageDetails is called', () => {
		describe('when pagecontent is requested', () => {
			it('should return a response', async () => {
				const { query, dto, response } = setup();
				mapper.mapDtoToResponse.mockReturnValue(response);
				uc.getPageContent.mockResolvedValue(dto);
				const testResp: PageContentResponse = await controller.getMigrationPageDetails(query);
				expect(testResp).toEqual(response);
			});
		});
	});
});
