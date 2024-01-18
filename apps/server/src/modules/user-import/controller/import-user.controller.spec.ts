import { AccountService } from '@modules/account/services/account.service';
import { AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ImportUserRepo, LegacySystemRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { UserImportFeatures } from '../config';
import { UserImportFetchUc, UserImportUc } from '../uc';
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
					provide: LegacySystemRepo,
					useValue: {},
				},
				{
					provide: UserRepo,
					useValue: {},
				},
				{
					provide: UserImportFeatures,
					useValue: {},
				},
				{
					provide: UserImportFetchUc,
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
