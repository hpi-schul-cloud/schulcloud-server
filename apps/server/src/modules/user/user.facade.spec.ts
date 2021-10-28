import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/testing/database';
import { userFactory, createCurrentTestUser } from '@shared/testing';
import { UserUC } from './uc';
import { UserFacade } from './user.facade';
import { ResolvedUserMapper } from './mapper';
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
				const user = userFactory.build();

				const resolvedUser = ResolvedUserMapper.mapToResponse(user);
				return Promise.resolve(resolvedUser);
			});

			const result = await facade.resolveUser(currentUser.userId);
			expect(result instanceof ResolvedUser).toBe(true);
			serviceSpy.mockRestore();
		});
	});
});
