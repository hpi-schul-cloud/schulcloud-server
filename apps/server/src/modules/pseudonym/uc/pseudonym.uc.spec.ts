import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { IFindOptions, Page, Pseudonym, School, User } from '@shared/domain';
import { pseudonymFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { ForbiddenException } from '@nestjs/common';
import { PseudonymSearchQuery } from '../domain';
import { PseudonymService } from '../service';
import { PseudonymUc } from './pseudonym.uc';
import { ICurrentUser } from '../../authentication';
import { Action, AuthorizationService } from '../../authorization';

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

	describe('findPseudonym', () => {
		describe('when valid user, query and params are given', () => {
			const setup = () => {
				const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
				const user: User = userFactory.build();
				const school: School = schoolFactory.build();
				user.school = school;
				const query: PseudonymSearchQuery = {
					userId: 'userId',
					toolId: 'toolId',
					pseudonym: 'pseudonym',
				};
				const options: IFindOptions<Pseudonym> = {
					pagination: {
						limit: 10,
						skip: 1,
					},
					order: {},
				};
				const page: Page<Pseudonym> = new Page<Pseudonym>([pseudonymFactory.build()], 1);

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				pseudonymService.findPseudonym.mockResolvedValueOnce(page);

				return {
					currentUser,
					user,
					school,
					query,
					options,
					page,
				};
			};

			it('should call authorization service with query and params', async () => {
				const { currentUser, user, school, query, options } = setup();

				await uc.findPseudonym(currentUser, query, options);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, school, {
					action: Action.read,
					requiredPermissions: [],
				});
			});

			it('should call service with query and params', async () => {
				const { currentUser, query, options } = setup();

				await uc.findPseudonym(currentUser, query, options);

				expect(pseudonymService.findPseudonym).toHaveBeenCalledWith(query, options);
			});

			it('should return page with pseudonyms', async () => {
				const { currentUser, query, options, page } = setup();

				const pseudonymPage: Page<Pseudonym> = await uc.findPseudonym(currentUser, query, options);

				expect(pseudonymPage).toEqual<Page<Pseudonym>>({
					data: [page.data[0]],
					total: page.total,
				});
			});
		});

		describe('when checkPermission throws', () => {
			const setup = () => {
				const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
				const query: PseudonymSearchQuery = {
					userId: 'userId',
					toolId: 'toolId',
					pseudonym: 'pseudonym',
				};
				const options: IFindOptions<Pseudonym> = {
					pagination: {
						limit: 10,
						skip: 1,
					},
					order: {},
				};
				const page: Page<Pseudonym> = new Page<Pseudonym>([pseudonymFactory.build()], 1);

				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});
				pseudonymService.findPseudonym.mockResolvedValueOnce(page);

				return {
					currentUser,
					query,
					options,
				};
			};

			it('should throw same exception', async () => {
				const { currentUser, query, options } = setup();

				const func = async () => uc.findPseudonym(currentUser, query, options);

				await expect(func()).rejects.toThrow(ForbiddenException);
			});
		});
	});
});
