import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from '@shared/domain';
import { AccountRepo, ImportUserRepo, SchoolRepo, UserRepo } from '@shared/repo';
import { UserImportUc } from '../uc/user-import.uc';
import { ImportUserController } from './import-user.controller';

describe('ImportUserController', () => {
	let controller: ImportUserController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserImportUc,
				{
					provide: AccountRepo,
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
