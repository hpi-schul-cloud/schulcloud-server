import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo, Pseudonym, SchoolEntity, User } from '@shared/domain';
import { legacySchoolDoFactory, pseudonymFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { ForbiddenException } from '@nestjs/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Action, AuthorizationService } from '@src/modules/authorization';
import { PseudonymService } from '../service';
import { PseudonymUc } from './pseudonym.uc';
import { LegacySchoolService } from '../../legacy-school';

describe('PseudonymUc', () => {
	let module: TestingModule;
	let uc: PseudonymUc;

	let pseudonymService: DeepMocked<PseudonymService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<LegacySchoolService>;

	beforeAll(async () => {
		await setupEntities();

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
				const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();
				const schoolEntity: SchoolEntity = schoolFactory.buildWithId();
				const user: User = userFactory.buildWithId({ school: schoolEntity });
				user.school = schoolEntity;
				const pseudonym: Pseudonym = new Pseudonym(pseudonymFactory.build({ userId: user.id }));

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				pseudonymService.findPseudonymByPseudonym.mockResolvedValueOnce(pseudonym);
				schoolService.getSchoolById.mockResolvedValue(school);

				return {
					currentUser,
					user,
					school,
					schoolEntity,
					pseudonym,
				};
			};

			it('should call authorization service with params', async () => {
				const { currentUser, user, school } = setup();

				await uc.findPseudonymByPseudonym(currentUser, 'pseudonym');

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, school, {
					action: Action.read,
					requiredPermissions: [],
				});
			});

			it('should call service with pseudonym', async () => {
				const { currentUser } = setup();

				await uc.findPseudonymByPseudonym(currentUser, 'pseudonym');

				expect(pseudonymService.findPseudonymByPseudonym).toHaveBeenCalledWith('pseudonym');
			});

			it('should call school service with school id from pseudonym user', async () => {
				const { currentUser, schoolEntity } = setup();

				await uc.findPseudonymByPseudonym(currentUser, 'pseudonym');

				expect(schoolService.getSchoolById).toHaveBeenCalledWith(schoolEntity.id);
			});

			it('should return pseudonym', async () => {
				const { currentUser, pseudonym } = setup();

				const foundPseudonym: Pseudonym = await uc.findPseudonymByPseudonym(currentUser, 'pseudonym');

				expect(foundPseudonym).toEqual(pseudonym);
			});
		});

		describe('when user is not authorized', () => {
			const setup = () => {
				const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
				const user: User = userFactory.build();
				const school: SchoolEntity = schoolFactory.build();
				user.school = school;
				const pseudonym: Pseudonym = new Pseudonym(pseudonymFactory.build());

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});
				pseudonymService.findPseudonymByPseudonym.mockResolvedValueOnce(pseudonym);

				return {
					currentUser,
				};
			};

			it('should throw forbidden exception', async () => {
				const { currentUser } = setup();

				const func = async () => uc.findPseudonymByPseudonym(currentUser, 'pseudonym');

				await expect(func()).rejects.toThrow(ForbiddenException);
			});
		});
	});
});
