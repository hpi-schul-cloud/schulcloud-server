import { Test, TestingModule } from '@nestjs/testing';
import { ImportUserRepo, SystemRepo, UserRepo } from '@shared/repo';
import { AccountService } from '@src/modules/account/services/account.service';
import { AuthorizationService } from '@src/modules/authorization';
import { LegacySchoolService } from '@src/modules/school-migration';
import { LoggerModule } from '@src/core/logger';
import { ConfigModule } from '@nestjs/config';
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
			imports: [LoggerModule, ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, ignoreEnvVars: true })],
			providers: [
				UserImportUc,
				{
					provide: AccountService,
					useValue: {},
				},
				{
					provide: AuthorizationService,
					useValue: {},
				},
				{
					provide: ImportUserRepo,
					useValue: {},
				},
				{
					provide: LegacySchoolService,
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
