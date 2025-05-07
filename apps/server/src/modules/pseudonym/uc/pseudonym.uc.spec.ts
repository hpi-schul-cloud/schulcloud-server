import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Action, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { Pseudonym } from '../repo';
import { PseudonymService } from '../service';
import { pseudonymFactory } from '../testing';
import { PseudonymUc } from './pseudonym.uc';

describe('PseudonymUc', () => {
	let module: TestingModule;
	let uc: PseudonymUc;

	let pseudonymService: DeepMocked<PseudonymService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<LegacySchoolService>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				PseudonymUc,
				{
					provide: PseudonymService,
					useValue: createMock<PseudonymService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
			],
		}).compile();

		uc = module.get(PseudonymUc);
		pseudonymService = module.get(PseudonymService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(LegacySchoolService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findPseudonymByPseudonym', () => {
		describe('when valid user and params are given', () => {
			const setup = () => {
				const userId = 'userId';
				const school = legacySchoolDoFactory.buildWithId();

				const schoolEntity = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school: schoolEntity });
				user.school = schoolEntity;
				const pseudonym: Pseudonym = new Pseudonym(pseudonymFactory.build({ userId: user.id }));

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				pseudonymService.findPseudonymByPseudonym.mockResolvedValueOnce(pseudonym);
				schoolService.getSchoolById.mockResolvedValue(school);

				return {
					userId,
					user,
					school,
					schoolEntity,
					pseudonym,
				};
			};

			it('should call authorization service with params', async () => {
				const { userId, user, school } = setup();

				await uc.findPseudonymByPseudonym(userId, 'pseudonym');

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, school, {
					action: Action.read,
					requiredPermissions: [],
				});
			});

			it('should call service with pseudonym', async () => {
				const { userId } = setup();

				await uc.findPseudonymByPseudonym(userId, 'pseudonym');

				expect(pseudonymService.findPseudonymByPseudonym).toHaveBeenCalledWith('pseudonym');
			});

			it('should call school service with school id from pseudonym user', async () => {
				const { userId, schoolEntity } = setup();

				await uc.findPseudonymByPseudonym(userId, 'pseudonym');

				expect(schoolService.getSchoolById).toHaveBeenCalledWith(schoolEntity.id);
			});

			it('should return pseudonym', async () => {
				const { userId, pseudonym } = setup();

				const foundPseudonym: Pseudonym = await uc.findPseudonymByPseudonym(userId, 'pseudonym');

				expect(foundPseudonym).toEqual(pseudonym);
			});
		});

		describe('when user is not authorized', () => {
			const setup = () => {
				const userId = 'userId';
				const user = userFactory.buildWithId();
				const school = schoolEntityFactory.buildWithId();
				user.school = school;
				const pseudonym: Pseudonym = new Pseudonym(pseudonymFactory.build());

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});
				pseudonymService.findPseudonymByPseudonym.mockResolvedValueOnce(pseudonym);

				return {
					userId,
				};
			};

			it('should throw forbidden exception', async () => {
				const { userId } = setup();

				const func = async () => uc.findPseudonymByPseudonym(userId, 'pseudonym');

				await expect(func()).rejects.toThrow(ForbiddenException);
			});
		});
	});
});
