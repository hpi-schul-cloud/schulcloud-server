import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Action, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { InstanceFeature, SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ForbiddenException } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Test, type TestingModule } from '@nestjs/testing';
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
	let schoolDomainService: DeepMocked<SchoolService>;

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
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		uc = module.get(PseudonymUc);
		pseudonymService = module.get(PseudonymService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(LegacySchoolService);
		schoolDomainService = module.get(SchoolService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('resolvePseudonymForUser', () => {
		describe('when valid user and params are given', () => {
			const setup = () => {
				const userId = 'userId';
				const school = legacySchoolDoFactory.buildWithId();

				const schoolEntity = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school: schoolEntity });
				user.school = schoolEntity;
				const pseudonym: Pseudonym = new Pseudonym(pseudonymFactory.build({ userId: user.id }));

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				pseudonymService.findOneByPseudonym.mockResolvedValueOnce(pseudonym);
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

				await uc.resolvePseudonymForUser(userId, 'pseudonym');

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, school, {
					action: Action.read,
					requiredPermissions: [],
				});
			});

			it('should call service with pseudonym', async () => {
				const { userId } = setup();

				await uc.resolvePseudonymForUser(userId, 'pseudonym');

				expect(pseudonymService.findOneByPseudonym).toHaveBeenCalledWith('pseudonym');
			});

			it('should call school service with school id from pseudonym user', async () => {
				const { userId, schoolEntity } = setup();

				await uc.resolvePseudonymForUser(userId, 'pseudonym');

				expect(schoolService.getSchoolById).toHaveBeenCalledWith(schoolEntity.id);
			});

			it('should return pseudonym', async () => {
				const { userId, pseudonym } = setup();

				const foundPseudonym: Pseudonym = await uc.resolvePseudonymForUser(userId, 'pseudonym');

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
				pseudonymService.findOneByPseudonym.mockResolvedValueOnce(pseudonym);

				return {
					userId,
				};
			};

			it('should throw forbidden exception', async () => {
				const { userId } = setup();

				const func = async () => await uc.resolvePseudonymForUser(userId, 'pseudonym');

				await expect(func()).rejects.toThrow(ForbiddenException);
			});
		});

		it('rejects an unknown pseudonym', async () => {
			const requestingUser = userFactory.buildWithId();
			authorizationService.getUserWithPermissions.mockResolvedValue(requestingUser);
			pseudonymService.findOneByPseudonym.mockResolvedValue(null);

			await expect(uc.resolvePseudonymForUser(requestingUser.id, 'missing')).rejects.toThrow(NotFoundLoggableException);
		});
	});

	describe('resolveNameForUser', () => {
		const setup = (student = false, deletedAt?: Date) => {
			const schoolEntity = schoolEntityFactory.buildWithId();
			const requestingUser = (student ? userFactory.asStudent() : userFactory.asTeacher()).buildWithId({
				school: schoolEntity,
			});
			const targetUser = userFactory.buildWithId({
				school: schoolEntity,
				firstName: 'Ada',
				lastName: 'Lovelace',
				deletedAt,
			});
			const pseudonym = pseudonymFactory.build({ userId: targetUser.id });

			authorizationService.getUserWithPermissions.mockImplementation((id) =>
				Promise.resolve(id === requestingUser.id ? requestingUser : targetUser)
			);
			pseudonymService.findOneByPseudonym.mockResolvedValue(pseudonym);
			schoolService.getSchoolById.mockResolvedValue(legacySchoolDoFactory.buildWithId());

			return { requestingUser };
		};

		it('returns the authorized user name', async () => {
			const { requestingUser } = setup();

			await expect(uc.resolveNameForUser(requestingUser.id, 'pseudonym')).resolves.toBe('Ada Lovelace');
		});

		it('keeps the legacy restriction on students listing users', async () => {
			const { requestingUser } = setup(true);
			schoolDomainService.getSchoolById.mockResolvedValue(schoolFactory.build());

			await expect(uc.resolveNameForUser(requestingUser.id, 'pseudonym')).rejects.toThrow(ForbiddenException);
		});

		it('allows students when student team creation is enabled', async () => {
			const { requestingUser } = setup(true);
			schoolDomainService.getSchoolById.mockResolvedValue(
				schoolFactory.build({ instanceFeatures: new Set([InstanceFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED]) })
			);

			await expect(uc.resolveNameForUser(requestingUser.id, 'pseudonym')).resolves.toBe('Ada Lovelace');
		});

		it('does not display a user deleted before the request', async () => {
			const { requestingUser } = setup(false, new Date('2020-01-01'));

			await expect(uc.resolveNameForUser(requestingUser.id, 'pseudonym')).resolves.toBe('???');
		});
	});
});
