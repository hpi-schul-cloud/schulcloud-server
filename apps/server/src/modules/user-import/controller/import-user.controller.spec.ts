import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from '@shared/domain';
import { ImportUserRepo, SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { AccountService } from '@src/modules/account/services/account.service';
import { UserImportUc } from '../uc/user-import.uc';
import { ImportUserController } from './import-user.controller';

describe('ImportUserController', () => {
	let module: TestingModule;
	let controller: ImportUserController;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserImportUc,
				{
					provide: AccountService,
					useValue: {},
				},
				{
					provide: PermissionService,
					useValue: {},
				},
				{
					provide: ImportUserRepo,
					useValue: {},
				},
				{
					provide: SchoolRepo,
					useValue: {},
				},
				{
					provide: SystemRepo,
					useValue: {},
				},
				{
					provide: UserRepo,
					useValue: {},
				},
			],
			controllers: [ImportUserController],
		}).compile();

		controller = module.get(ImportUserController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
