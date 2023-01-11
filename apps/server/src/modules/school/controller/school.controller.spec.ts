import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@shared/domain';
import { SchoolController } from './school.controller';
import { SchoolUc } from '../uc/school.uc';
import { MigrationBody, MigrationResponse, SchoolParams } from './dto';
import { MigrationMapper } from '../mapper/migration.mapper';
import { MigrationDto } from '../dto/migration.dto';
import { PublicSchoolResponse } from './dto/public.school.response';
import { SchoolQueryParams } from './dto/school.query.params';

describe('School Controller', () => {
	let module: TestingModule;
	let controller: SchoolController;
	let schoolUc: DeepMocked<SchoolUc>;
	let mapper: DeepMocked<MigrationMapper>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [SchoolController],
			providers: [
				{
					provide: SchoolUc,
					useValue: createMock<SchoolUc>(),
				},
				{
					provide: MigrationMapper,
					useValue: createMock<MigrationMapper>(),
				},
			],
		}).compile();
		controller = module.get(SchoolController);
		schoolUc = module.get(SchoolUc);
		mapper = module.get(MigrationMapper);
	});

	afterAll(async () => {
		await module.close();
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	const setupBasicData = () => {
		const schoolParams: SchoolParams = { schoolId: new ObjectId().toHexString() };
		const testUser: ICurrentUser = { userId: 'testUser' } as ICurrentUser;
		const schoolQueryParams: SchoolQueryParams = { schoolnumber: '1234' } as SchoolQueryParams;

		const migrationResp: MigrationResponse = {
			oauthMigrationMandatory: new Date(),
			oauthMigrationPossible: new Date(),
			oauthMigrationFinished: new Date(),
			enableMigrationStart: true,
		};
		const migrationDto: MigrationDto = new MigrationDto({
			oauthMigrationMandatory: new Date(),
			oauthMigrationPossible: new Date(),
			oauthMigrationFinished: new Date(),
			enableMigrationStart: true,
		});
		return { schoolParams, schoolQueryParams, testUser, migrationDto, migrationResp };
	};

	describe('setMigration', () => {
		describe('when migrationflags, schoolId and userId is given', () => {
			it('should call UC', async () => {
				const { schoolParams, testUser, migrationDto, migrationResp } = setupBasicData();
				schoolUc.setMigration.mockResolvedValue(migrationDto);
				mapper.mapDtoToResponse.mockReturnValue(migrationResp);
				const body: MigrationBody = { oauthMigrationPossible: true, oauthMigrationMandatory: true };
				const res: MigrationResponse = await controller.setMigration(schoolParams, body, testUser);
				expect(schoolUc.setMigration).toHaveBeenCalled();
				expect(res).toBe(migrationResp);
			});
		});
	});

	describe('getMigration', () => {
		describe('when schoolId and UserId are given', () => {
			it('should call UC', async () => {
				const { schoolParams, testUser, migrationDto, migrationResp } = setupBasicData();
				schoolUc.getMigration.mockResolvedValue(migrationDto);
				mapper.mapDtoToResponse.mockReturnValue(migrationResp);
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
				const res: PublicSchoolResponse = await controller.getPublicSchool(schoolQueryParams);
				expect(schoolUc.getPublicSchoolData).toHaveBeenCalled();
				expect(res).toBe(publicSchoolResponse);
			});
		});
	});
});
