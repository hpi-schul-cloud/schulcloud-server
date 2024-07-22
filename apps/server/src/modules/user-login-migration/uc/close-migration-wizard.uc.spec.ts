import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { UserImportService } from '@modules/user-import';
import { Test, TestingModule } from '@nestjs/testing';
import { legacySchoolDoFactory, schoolEntityFactory, setupEntities, userFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { CloseMigrationWizardUc } from './close-migration-wizard.uc';

describe(CloseMigrationWizardUc.name, () => {
	let module: TestingModule;
	let uc: CloseMigrationWizardUc;

	let schoolService: DeepMocked<LegacySchoolService>;
	let userImportService: DeepMocked<UserImportService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				CloseMigrationWizardUc,
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: UserImportService,
					useValue: createMock<UserImportService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(CloseMigrationWizardUc);
		schoolService = module.get(LegacySchoolService);
		userImportService = module.get(UserImportService);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('closeMigrationWizardWhenActive', () => {
		describe('when school is in user migration', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const user = userFactory.buildWithId({ school: schoolEntityFactory.build({ _id: schoolId }) });
				const school = legacySchoolDoFactory.build({ inUserMigration: true });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);

				return {
					user,
					school,
				};
			};

			it('should check users permissions', async () => {
				const { user } = setup();

				await uc.closeMigrationWizardWhenActive(user.id);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, ['IMPORT_USER_MIGRATE']);
			});

			it('should reset migration wizard for users school', async () => {
				const { user, school } = setup();

				await uc.closeMigrationWizardWhenActive(user.id);

				expect(userImportService.resetMigrationForUsersSchool).toHaveBeenCalledWith(user, school);
			});
		});

		describe('when school is not in user migration', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const user = userFactory.buildWithId({ school: schoolEntityFactory.build({ _id: schoolId }) });
				const school = legacySchoolDoFactory.build({ inUserMigration: false });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);

				return {
					user,
					school,
				};
			};

			it('should not check users permissions', async () => {
				const { user } = setup();

				await uc.closeMigrationWizardWhenActive(user.id);

				expect(authorizationService.checkAllPermissions).not.toHaveBeenCalled();
			});

			it('should not reset migration wizard for users school', async () => {
				const { user } = setup();

				await uc.closeMigrationWizardWhenActive(user.id);

				expect(userImportService.resetMigrationForUsersSchool).not.toHaveBeenCalled();
			});
		});
	});
});
