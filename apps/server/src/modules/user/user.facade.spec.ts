import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { Role, User } from '@shared/domain';
import { schoolFactory } from '@shared/domain/factory/school.factory';
import { UserUC } from './uc';
import { UserFacade } from './user.facade';
import { ResolvedUserMapper } from './mapper';
import { createCurrentTestUser } from './utils';
import { ResolvedUser } from './controller/dto';

describe('UserFacade', () => {
	let module: TestingModule;
	let facade: UserFacade;
	let service: UserUC;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				UserFacade,
				UserUC,
				{
					provide: UserUC,
					useValue: {
						getUserWithPermissions() {},
					},
				},
			],
		}).compile();

		facade = module.get(UserFacade);
		service = module.get(UserUC);
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(facade).toBeDefined();
		expect(typeof facade.resolveUser).toEqual('function');
	});

	describe('getUserWithPermissions', () => {
		it('should return valid solved and mapped typ', async () => {
			const { currentUser } = createCurrentTestUser();

			const serviceSpy = jest.spyOn(service, 'getUserWithPermissions').mockImplementation(() => {
				const school = schoolFactory.build();
				const roles = [new Role({ name: 'name' })] as Role[];
				const user = new User({ email: 'email', roles, school });

				const resolvedUser = ResolvedUserMapper.mapToResponse(user);
				return Promise.resolve(resolvedUser);
			});

			const result = await facade.resolveUser(currentUser);
			expect(result instanceof ResolvedUser).toBe(true);
			serviceSpy.mockRestore();
		});
	});
});
