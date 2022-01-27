import { Test, TestingModule } from '@nestjs/testing';
import { ImportUserRepo, UserRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { UserImportUc } from '../uc/user-import.uc';
import { ImportUserController } from './import-user.controller';

describe('ImportUserController', () => {
	let controller: ImportUserController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserImportUc,
				{
					provide: AuthorizationService,
					useValue: {},
				},
				{
					provide: ImportUserRepo,
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
