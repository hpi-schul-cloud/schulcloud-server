import { Test, TestingModule } from '@nestjs/testing';
import { SchoolService } from '@src/modules/school/service/school.service';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MigrationResponse } from '../controller/dto';
import { AuthorizationService } from '../../authorization';

describe('SchoolUc', () => {
	let module: TestingModule;
	let schoolUc: SchoolUc;
	let schoolService: DeepMocked<SchoolService>;
	let authService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolUc,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();
		schoolService = module.get(SchoolService);
		authService = module.get(AuthorizationService);
		schoolUc = module.get(SchoolUc);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('setMigration', () => {
		let migrationResponse: MigrationResponse;
		const mockId = 'someId';
		beforeAll(() => {
			migrationResponse = new MigrationResponse({
				oauthMigrationPossible: true,
				oauthMigrationMandatory: true,
			});
			schoolService.setMigration.mockResolvedValue(migrationResponse);
			authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
		});
		it('should call the service', async () => {
			await schoolUc.setMigration(mockId, true, true, mockId);

			expect(schoolService.setMigration).toHaveBeenCalledWith(mockId, true, true);
		});
	});

	describe('getMigration', () => {
		let migrationResponse: MigrationResponse;
		const mockId = 'someId';
		beforeAll(() => {
			schoolService.getMigration.mockResolvedValue(migrationResponse);
			authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
		});
		it('should call the service', async () => {
			await schoolUc.getMigration(mockId, mockId);

			expect(schoolService.getMigration).toHaveBeenCalledWith(mockId);
		});
	});
});
