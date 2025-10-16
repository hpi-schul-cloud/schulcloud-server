import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { User, UserMikroOrmRepo } from '../../repo';
import { userDoFactory, userFactory } from '../../testing';
import { UserAuthorizableService } from './user-authorizable.service';
import { UserService } from './user.service';

describe(UserAuthorizableService.name, () => {
	let module: TestingModule;
	let service: UserAuthorizableService;

	let userRepo: DeepMocked<UserMikroOrmRepo>;
	let userService: DeepMocked<UserService>;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserAuthorizableService,
				{
					provide: UserMikroOrmRepo,
					useValue: createMock<UserMikroOrmRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				AuthorizationInjectionService,
			],
		}).compile();

		service = module.get(UserAuthorizableService);
		userRepo = module.get(UserMikroOrmRepo);
		userService = module.get(UserService);
		injectionService = module.get(AuthorizationInjectionService);
		await setupEntities([User]);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		it('should inject itself into the AuthorizationInjectionService', () => {
			expect(injectionService.getReferenceLoader(AuthorizableReferenceType.User)).toBe(service);
		});

		it('should inject itself as a CurrentUserLoader into the AuthorizationInjectionService', () => {
			expect(injectionService.getCurrentUserLoader()).toBe(service);
		});
	});

	describe('findById', () => {
		describe('when id is given', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();

				userService.findById.mockResolvedValue(user);

				return {
					user,
				};
			};

			it('should return a user', async () => {
				const { user } = setup();

				const result = await service.findById(user.id as string);

				expect(result).toEqual(user);
			});
		});
	});

	describe('loadCurrentUserWithPermissions', () => {
		describe('when user is returned by repo', () => {
			const setup = () => {
				const user = userFactory.build();

				userRepo.findById.mockResolvedValue(user);

				return {
					user,
				};
			};

			it('should return a user', async () => {
				const { user } = setup();

				const result = await service.loadCurrentUserWithPermissions(user.id);

				expect(result).toEqual(user);
			});

			it('should call userRepo.findById with id and true', async () => {
				const { user } = setup();

				await service.loadCurrentUserWithPermissions(user.id);

				expect(userRepo.findById).toHaveBeenCalledWith(user.id, true);
			});
		});
	});
});
