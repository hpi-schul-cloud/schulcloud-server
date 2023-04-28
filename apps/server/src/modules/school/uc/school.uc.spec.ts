import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { schoolDOFactory } from '@shared/testing/factory/domainobject/school.factory';
import { AuthorizationService } from '@src/modules/authorization';
import { SchoolService } from '@src/modules/school/service/school.service';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { SchoolMigrationService, UserLoginMigrationService } from '@src/modules/user-login-migration';
import { OauthMigrationDto } from '@src/modules/user-login-migration/service/dto';
import { PublicSchoolResponse } from '../controller/dto/public.school.response';

describe('SchoolUc', () => {
	let module: TestingModule;
	let schoolUc: SchoolUc;

	let schoolService: DeepMocked<SchoolService>;
	let authService: DeepMocked<AuthorizationService>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;
	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;

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
				{
					provide: SchoolMigrationService,
					useValue: createMock<SchoolMigrationService>(),
				},
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
			],
		}).compile();

		schoolService = module.get(SchoolService);
		authService = module.get(AuthorizationService);
		schoolUc = module.get(SchoolUc);
		schoolMigrationService = module.get(SchoolMigrationService);
		userLoginMigrationService = module.get(UserLoginMigrationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('setMigration is called', () => {
		let migrationResponse: OauthMigrationDto;
		const mockId = 'someId';

		const setup = () => {
			migrationResponse = new OauthMigrationDto({
				oauthMigrationPossible: new Date(),
				oauthMigrationMandatory: new Date(),
				oauthMigrationFinished: new Date(),
				enableMigrationStart: true,
			});
			userLoginMigrationService.setMigration.mockResolvedValue(migrationResponse);
			authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
			schoolService.getSchoolById.mockResolvedValue(
				schoolDOFactory.buildWithId({
					name: 'mockName',
					id: mockId,
					oauthMigrationFinished: undefined,
					oauthMigrationStart: new Date(2023, 1, 1),
				})
			);
		};

		describe('when migrationflags and schoolId and userId are given', () => {
			it('should call the service', async () => {
				setup();

				await schoolUc.setMigration(mockId, true, true, true, mockId);

				expect(userLoginMigrationService.setMigration).toHaveBeenCalledWith(mockId, true, true, true);
			});
		});

		describe('when oauthMigrationFinished is given', () => {
			it('should call schoolMigrationService to complete the migration when oauthMigrationFinished is true', async () => {
				setup();
				const migrationStartedAt = new Date(2023, 1, 1);

				await schoolUc.setMigration(mockId, false, true, true, mockId);

				expect(schoolMigrationService.completeMigration).toHaveBeenCalledWith(mockId, migrationStartedAt);
			});

			it('should not call the schoolMigrationService when oauthMigrationFinished is false', async () => {
				setup();

				await schoolUc.setMigration(mockId, true, true, false, mockId);

				expect(schoolMigrationService.completeMigration).not.toHaveBeenCalled();
			});
		});

		describe('after school migration has finished', () => {
			it('should call schoolMigrationService to restart the migration', async () => {
				setup();

				schoolService.getSchoolById.mockResolvedValue(
					schoolDOFactory.buildWithId({
						name: 'mockName',
						id: mockId,
						oauthMigrationFinished: new Date(),
						oauthMigrationMandatory: new Date(),
					})
				);
				await schoolUc.setMigration(mockId, true, true, false, mockId);

				expect(schoolMigrationService.restartMigration).toHaveBeenCalledWith(mockId);
			});

			it('should not call schoolMigrationService when ', async () => {
				setup();

				await schoolUc.setMigration(mockId, true, true, false, mockId);

				expect(schoolMigrationService.restartMigration).not.toHaveBeenCalled();
			});
		});
	});

	describe('getMigration is called', () => {
		let migrationResponse: OauthMigrationDto;
		const mockId = 'someId';

		describe('when schoolId and UserId are given', () => {
			it('should call the service', async () => {
				userLoginMigrationService.getMigration.mockResolvedValue(migrationResponse);
				authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());

				await schoolUc.getMigration(mockId, mockId);

				expect(userLoginMigrationService.getMigration).toHaveBeenCalledWith(mockId);
			});
		});
	});

	describe('when it calls the service to get public school data', () => {
		let schoolDO: SchoolDO;
		const mockSchoolnumber = '1234';

		it('should call the service and return an object', async () => {
			schoolDO = schoolDOFactory.buildWithId({ name: 'mockSchool', officialSchoolNumber: '1234' });
			schoolService.getSchoolBySchoolNumber.mockResolvedValue(schoolDO);

			const response: PublicSchoolResponse = await schoolUc.getPublicSchoolData(mockSchoolnumber);

			expect(schoolService.getSchoolBySchoolNumber).toHaveBeenCalledWith(mockSchoolnumber);
			expect(response).not.toBeNull();
		});

		it('should call the service and throw an exception', async () => {
			schoolService.getSchoolBySchoolNumber.mockResolvedValue(null);
			const resp: Promise<PublicSchoolResponse> = schoolUc.getPublicSchoolData(mockSchoolnumber);
			await expect(resp).rejects.toThrow(NotFoundException);
		});
	});
});
