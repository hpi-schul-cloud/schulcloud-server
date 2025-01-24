import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { AuthorizationService } from '@modules/authorization';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { userFactory } from '@testing/factory/user.factory';
import { setupEntities } from '@testing/setup-entities';
import { MediaSchoolLicenseService } from '../service';
import { MediaSchoolLicenseUc } from './media-school-license.uc';

describe(MediaSchoolLicenseUc.name, () => {
	let module: TestingModule;
	let uc: MediaSchoolLicenseUc;
	let mediaSchoolLicenseService: DeepMocked<MediaSchoolLicenseService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities();

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

					authorizationService.getUserWithPermissions.mockResolvedValue(user);
					authorizationService.checkAllPermissions.mockImplementation(() => {
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

					authorizationService.getUserWithPermissions.mockResolvedValue(user);
					authorizationService.checkAllPermissions.mockImplementation(() => {
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
});
