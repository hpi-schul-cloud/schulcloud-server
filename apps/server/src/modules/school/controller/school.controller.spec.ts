import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@shared/domain';
import { SchoolController } from './school.controller';
import { SchoolUc } from '../uc/school.uc';
import { MigrationBody, MigrationResponse, SchoolParams } from './dto';
import { PublicSchoolResponse } from './dto/public.school.response';
import { SchoolQueryParams } from './dto/school.query.params';

describe('School Controller', () => {
	let module: TestingModule;
	let controller: SchoolController;
	let schoolUc: DeepMocked<SchoolUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [SchoolController],
			providers: [
				{
					provide: SchoolUc,
					useValue: createMock<SchoolUc>(),
				},
			],
		}).compile();
		controller = module.get(SchoolController);
		schoolUc = module.get(SchoolUc);
	});

	afterAll(async () => {
		await module.close();
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	const setupBasicData = () => {
		const schoolParams: SchoolParams = { schoolId: new ObjectId().toHexString() } as SchoolParams;
		const schoolQueryParams: SchoolQueryParams = { schoolnumber: '1234' } as SchoolQueryParams;
		const testUser = { userId: 'testUser' } as ICurrentUser;

		return { schoolParams, schoolQueryParams, testUser };
	};

	describe('when it sets the migrationflags', () => {
		it('should call UC', async () => {
			const { schoolParams, testUser } = setupBasicData();
			const migrationResp: MigrationResponse = { oauthMigrationMandatory: true, oauthMigrationPossible: true };
			schoolUc.setMigration.mockResolvedValue(migrationResp);
			const body: MigrationBody = { oauthMigrationPossible: true, oauthMigrationMandatory: true };
			const res: MigrationResponse = await controller.setMigration(schoolParams, body, testUser);
			expect(schoolUc.setMigration).toHaveBeenCalled();
			expect(res).toBe(migrationResp);
		});
	});

	describe('when it gets the migrationflags', () => {
		it('should call UC', async () => {
			const { schoolParams, testUser } = setupBasicData();
			const migrationResp: MigrationResponse = { oauthMigrationMandatory: true, oauthMigrationPossible: true };
			schoolUc.getMigration.mockResolvedValue(migrationResp);
			const res: MigrationResponse = await controller.getMigration(schoolParams, testUser);
			expect(schoolUc.getMigration).toHaveBeenCalled();
			expect(res).toBe(migrationResp);
		});
	});

	describe('when it gets the public schooldata', () => {
		it('should call UC', async () => {
			const { schoolQueryParams } = setupBasicData();
			const publicSchoolResponse: PublicSchoolResponse = {
				schoolName: 'testSchool',
				schoolNumber: '1234',
				oauthMigrationMandatory: true,
				oauthMigrationPossible: true,
			};
			schoolUc.getPublicSchoolData.mockResolvedValue(publicSchoolResponse);
			const res: MigrationResponse = await controller.getPublicSchool(schoolQueryParams);
			expect(schoolUc.getPublicSchoolData).toHaveBeenCalled();
			expect(res).toBe(publicSchoolResponse);
		});
	});
});
