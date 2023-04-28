import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { OauthMigrationDto } from '@src/modules/user-login-migration/service/dto';
import { MigrationMapper } from '../mapper/migration.mapper';
import { SchoolUc } from '../uc/school.uc';
import { MigrationBody, MigrationResponse, SchoolParams } from './dto';
import { PublicSchoolResponse } from './dto/public.school.response';
import { SchoolQueryParams } from './dto/school.query.params';
import { SchoolController } from './school.controller';

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
		const migrationDto: OauthMigrationDto = new OauthMigrationDto({
			oauthMigrationMandatory: new Date(),
			oauthMigrationPossible: new Date(),
			oauthMigrationFinished: new Date(),
			enableMigrationStart: true,
		});
		return { schoolParams, schoolQueryParams, testUser, migrationDto, migrationResp };
	};

	describe('setMigration', () => {
		describe('when migrationflags exist and schoolId and userId are given', () => {
			it('should call UC and recieve a response', async () => {
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
			it('should call UC and recieve a response', async () => {
				const { schoolParams, testUser, migrationDto, migrationResp } = setupBasicData();
				schoolUc.getMigration.mockResolvedValue(migrationDto);
				mapper.mapDtoToResponse.mockReturnValue(migrationResp);

				const res: MigrationResponse = await controller.getMigration(schoolParams, testUser);

				expect(schoolUc.getMigration).toHaveBeenCalled();
				expect(res).toBe(migrationResp);
			});
		});
	});

	describe('getPublicSchool', () => {
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

		describe('when schoolnumber is missing', () => {
			it('should call the uc with empty string', async () => {
				const { schoolQueryParams } = setupBasicData();
				schoolQueryParams.schoolnumber = undefined;

				await controller.getPublicSchool(schoolQueryParams);

				expect(schoolUc.getPublicSchoolData).toHaveBeenCalledWith('');
			});
		});
	});
});
