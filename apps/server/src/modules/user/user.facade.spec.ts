import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { ResolvedUser } from '@shared/domain/entity';
import { UserUC, GroupUC } from './uc';
import { UserFacade } from './user.facade';
import { Role, User } from './entity';
import { ResolvedUserMapper } from './mapper';
import { createCurrentTestUser } from './utils';

describe('UserFacade', () => {
	let facade: UserFacade;
	let service: UserUC;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserFacade,
				UserUC,
				{
					provide: UserUC,
					useValue: {
						getUserWithPermissions() {},
					},
				},
				GroupUC,
				{
					provide: GroupUC,
					useValue: {
						getGroupsByUserAndType() {},
					},
				},
			],
		}).compile();

		facade = module.get(UserFacade);
		service = module.get(UserUC);
	});

	it('should be defined', () => {
		expect(facade).toBeDefined();
		expect(typeof facade.resolveUser).toEqual('function');
		expect(typeof facade.getCourseGroupsByUserId).toEqual('function');
	});

	describe('getCourseGroupsByUserId', () => {});

	describe('getUserWithPermissions', () => {
		it('should return valid solved and mapped typ', async () => {
			const { currentUser } = createCurrentTestUser();

			const serviceSpy = jest.spyOn(service, 'getUserWithPermissions').mockImplementation(() => {
				const school = new ObjectId().toHexString();
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
