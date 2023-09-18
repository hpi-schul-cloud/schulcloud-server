import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { IFindOptions, Page, Pseudonym, School, User } from '@shared/domain';
import { pseudonymFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { ForbiddenException } from '@nestjs/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Action, AuthorizationService } from '@src/modules/authorization';
import { PseudonymSearchQuery } from '../domain';
import { PseudonymService } from '../service';
import { PseudonymUc } from './pseudonym.uc';

describe('PseudonymUc', () => {
	let module: TestingModule;
	let uc: PseudonymUc;

	let pseudonymService: DeepMocked<PseudonymService>;
	let authorizationService: DeepMocked<AuthorizationService>;

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
			],
		}).compile();

		uc = module.get(PseudonymUc);
		pseudonymService = module.get(PseudonymService);
		authorizationService = module.get(AuthorizationService);
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
				const user: User = userFactory.build();
				const school: School = schoolFactory.build();
				user.school = school;
				const query: PseudonymSearchQuery = {
					pseudonym: 'pseudonym',
				};
				const options: IFindOptions<Pseudonym> = {};
				const pseudonym: Pseudonym = new Pseudonym(pseudonymFactory.build());

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				pseudonymService.findPseudonym.mockResolvedValueOnce(new Page([pseudonym], 1));

				return {
					currentUser,
					user,
					school,
					query,
					options,
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

			it('should call service with query and params', async () => {
				const { currentUser, query, options } = setup();

				await uc.findPseudonymByPseudonym(currentUser, 'pseudonym');

				expect(pseudonymService.findPseudonym).toHaveBeenCalledWith(query, options);
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
				const school: School = schoolFactory.build();
				user.school = school;
				const pseudonym: Pseudonym = new Pseudonym(pseudonymFactory.build());

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});
				pseudonymService.findPseudonym.mockResolvedValueOnce(new Page([pseudonym], 1));

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
