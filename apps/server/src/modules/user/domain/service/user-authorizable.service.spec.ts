import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationInjectionService } from '@modules/authorization/domain/service/authorization-injection.service';
import { AuthorizableReferenceType } from '@modules/authorization/domain/type/allowed-authorization-object-type.enum';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { User, UserRepo } from '../../repo';
import { userFactory } from '../../testing';
import { UserAuthorizableService } from './user-authorizable.service';

describe(UserAuthorizableService.name, () => {
	let module: TestingModule;
	let service: UserAuthorizableService;

	let userRepo: DeepMocked<UserRepo>;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserAuthorizableService,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				AuthorizationInjectionService,
			],
		}).compile();

		service = module.get(UserAuthorizableService);
		userRepo = module.get(UserRepo);
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
				const user = userFactory.build();

				userRepo.findById.mockResolvedValue(user);

				return {
					user,
				};
			};

			it('should return a user', async () => {
				const { user } = setup();

				const result = await service.findById(user.id);

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
