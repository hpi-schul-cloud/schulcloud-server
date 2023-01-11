import { Test, TestingModule } from '@nestjs/testing';
import { SchoolService } from '@src/modules/school/service/school.service';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '../../authorization';
import { MigrationDto } from '../dto/migration.dto';

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

	describe('setMigration is called', () => {
		let migrationResponse: MigrationDto;
		const mockId = 'someId';
		beforeAll(() => {
			migrationResponse = new MigrationDto({
				oauthMigrationPossible: new Date(),
				oauthMigrationMandatory: new Date(),
				oauthMigrationFinished: new Date(),
				enableMigrationStart: true,
			});
			schoolService.setMigration.mockResolvedValue(migrationResponse);
			authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
		});

		describe('when migrationflags and schoolId and userId are given', () => {
			it('should call the service', async () => {
				await schoolUc.setMigration(mockId, true, true, true, mockId);

				expect(schoolService.setMigration).toHaveBeenCalledWith(mockId, true, true, true);
			});
		});
	});

	describe('getMigration is called', () => {
		let migrationResponse: MigrationDto;
		const mockId = 'someId';
		beforeAll(() => {
			schoolService.getMigration.mockResolvedValue(migrationResponse);
			authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
		});

		describe('when schoolId and UserId are given', () => {
			it('should call the service', async () => {
				await schoolUc.getMigration(mockId, mockId);

				expect(schoolService.getMigration).toHaveBeenCalledWith(mockId);
			});
		});
	});
});
