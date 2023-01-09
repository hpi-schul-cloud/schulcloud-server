import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MigrationUc } from '../uc/migration.uc';
import { MigrationController } from './migration.controller';
import { PageContentQueryParams, PageTypes } from './dto/page-type.query.param';
import { PageContentResponse } from './dto/page-content.response';

describe('MigrationController', () => {
	let module: TestingModule;
	let controller: MigrationController;
	let uc: DeepMocked<MigrationUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: MigrationUc,
					useValue: createMock<MigrationUc>(),
				},
			],
			controllers: [MigrationController],
		}).compile();

		controller = module.get(MigrationController);
		uc = module.get(MigrationUc);
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
		beforeAll(() => {
			query = {
				pageType: PageTypes.START_FROM_NEW_SYSTEM,
				sourceSystem: 'source',
				targetSystem: 'target',
			};
			response = {
				proceedButtonUrl: 'proceedUrl',
				cancelButtonUrl: 'cancelUrl',
			};
			uc.getPageContent.mockResolvedValue(response);
		});
		it('should return a response', async () => {
			const testResp: PageContentResponse = await controller.getMigrationPageDetails(query);
			expect(uc.getPageContent).toHaveBeenCalled();
			expect(testResp).toEqual(response);
		});
	});
});
