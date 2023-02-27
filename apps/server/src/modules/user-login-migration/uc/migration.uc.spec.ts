import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UserMigrationService } from '@src/modules/user-login-migration/service/user-migration.service';
import { MigrationUc } from './migration.uc';
import { PageContentDto } from '../service/dto/page-content.dto';
import { PageTypes } from '../interface/page-types.enum';

describe('MigrationUc', () => {
	let module: TestingModule;
	let uc: MigrationUc;
	let service: DeepMocked<UserMigrationService>;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MigrationUc,
				{
					provide: UserMigrationService,
					useValue: createMock<UserMigrationService>(),
				},
			],
		}).compile();
		uc = module.get(MigrationUc);
		service = module.get(UserMigrationService);
	});

	afterAll(async () => {
		await module.close();
	});

	const setup = () => {
		const dto: PageContentDto = {
			proceedButtonUrl: 'proceed',
			cancelButtonUrl: 'cancel',
		};
		return { dto };
	};

	describe('getPageContent is called', () => {
		describe('when it should get page-content', () => {
			it('should return a response', async () => {
				const { dto } = setup();
				service.getPageContent.mockResolvedValue(dto);
				const testResp: PageContentDto = await uc.getPageContent(
					PageTypes.START_FROM_TARGET_SYSTEM,
					'source',
					'target'
				);
				expect(testResp.proceedButtonUrl).toEqual(dto.proceedButtonUrl);
				expect(testResp.cancelButtonUrl).toEqual(dto.cancelButtonUrl);
			});
		});
	});
});
