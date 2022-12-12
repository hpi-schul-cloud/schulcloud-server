import { Test, TestingModule } from '@nestjs/testing';
import { SchoolService } from '@src/modules/school/service/school.service';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MigrationResponse } from '../controller/dto';

describe('SchoolUc', () => {
	let module: TestingModule;
	let schoolUc: SchoolUc;
	let schoolService: DeepMocked<SchoolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolUc,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();
		schoolService = module.get(SchoolService);
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
		});
		it('should call the service to set the migrationflags', async () => {
			await schoolUc.setMigration(mockId, true, true);

			expect(schoolService.setMigration).toHaveBeenCalledWith(mockId, true, true);
		});
	});
});
