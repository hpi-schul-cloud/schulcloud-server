import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { MediaSchoolLicenseService } from '../service';
import { mediaSchoolLicenseFactory } from '../testing';
import { MediaSchoolLicenseUc } from './media-school-license.uc';

describe(MediaSchoolLicenseUc.name, () => {
	let module: TestingModule;
	let uc: MediaSchoolLicenseUc;
	let mediaSchoolLicenseService: DeepMocked<MediaSchoolLicenseService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				MediaSchoolLicenseUc,
				{
					provide: MediaSchoolLicenseService,
					useValue: createMock<MediaSchoolLicenseService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(MediaSchoolLicenseUc);
		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('updateMediaSchoolLicenses', () => {
		describe('when current user and schoolId is given', () => {
			describe('when current user has permission', () => {
				const setup = () => {
					const school = schoolEntityFactory.build();
					const user = userFactory.asAdmin([Permission.MEDIA_SCHOOL_LICENSE_ADMIN]).buildWithId({ school });

					authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
					authorizationService.checkAllPermissions.mockImplementationOnce(() => {
						void Promise.resolve();
					});

					return {
						user,
					};
				};

				it('should call mediaSchoolService', async () => {
					const { user } = setup();

					await uc.updateMediaSchoolLicenses(user.id, user.school.id);

					expect(mediaSchoolLicenseService.updateMediaSchoolLicenses).toHaveBeenCalledWith(user.school.id);
				});
			});

			describe('when current user has no permission', () => {
				const setup = () => {
					const school = schoolEntityFactory.build();
					const user = userFactory.buildWithId({ school });

					authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
					authorizationService.checkAllPermissions.mockImplementationOnce(() => {
						throw new UnauthorizedException();
					});

					return {
						user,
					};
				};

				it('should throw error', async () => {
					const { user } = setup();

					await expect(uc.updateMediaSchoolLicenses(user.id, user.school.id)).rejects.toThrow(UnauthorizedException);
					expect(mediaSchoolLicenseService.updateMediaSchoolLicenses).not.toHaveBeenCalled();
				});
			});
		});
	});

	describe('updateMediaSchoolLicenses', () => {
		describe('when the user has permission', () => {
			const setup = () => {
				const school = schoolEntityFactory.build();
				const user = userFactory.asAdmin().buildWithId({ school });
				const licenses = mediaSchoolLicenseFactory.buildList(2);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce(licenses);

				return {
					user,
					licenses,
				};
			};

			it('should check for permissions', async () => {
				const { user } = setup();

				await uc.getMediaSchoolLicensesForSchool(user.id, user.school.id);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [
					Permission.MEDIA_SCHOOL_LICENSE_ADMIN,
				]);
			});

			it('should return licenses', async () => {
				const { user, licenses } = setup();

				const result = await uc.getMediaSchoolLicensesForSchool(user.id, user.school.id);

				expect(result).toEqual(licenses);
			});
		});

		describe('when the user has no permission', () => {
			const setup = () => {
				const school = schoolEntityFactory.build();
				const user = userFactory.asTeacher().buildWithId({ school });

				const error = new UnauthorizedException();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkAllPermissions.mockImplementationOnce(() => {
					throw error;
				});

				return {
					user,
					error,
				};
			};

			it('should throw an error', async () => {
				const { user, error } = setup();

				await expect(uc.getMediaSchoolLicensesForSchool(user.id, user.school.id)).rejects.toThrow(error);
			});
		});
	});
});
