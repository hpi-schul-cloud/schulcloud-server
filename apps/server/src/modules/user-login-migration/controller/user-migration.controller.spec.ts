import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { PageTypes } from '../interface/page-types.enum';
import { PageContentMapper } from '../mapper/page-content.mapper';
import { PageContentDto } from '../service/dto/page-content.dto';
import { UserLoginMigrationUc } from '../uc/user-login-migration.uc';
import { PageContentQueryParams, PageContentResponse } from './dto';
import { UserMigrationController } from './user-migration.controller';

describe('MigrationController', () => {
	let module: TestingModule;
	let controller: UserMigrationController;
	let uc: DeepMocked<UserLoginMigrationUc>;
	let mapper: DeepMocked<PageContentMapper>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: UserLoginMigrationUc,
					useValue: createMock<UserLoginMigrationUc>(),
				},
				{
					provide: PageContentMapper,
					useValue: createMock<PageContentMapper>(),
				},
			],
			controllers: [UserMigrationController],
		}).compile();

		controller = module.get(UserMigrationController);
		uc = module.get(UserLoginMigrationUc);
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
