import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { RoleName, RoleService } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../domain/service/user.service';
import { userDoFactory } from '../testing';
import { AdminApiUserUc } from './admin-api-user.uc';

describe('admin api user uc', () => {
	let module: TestingModule;
	let uc: AdminApiUserUc;
	let userService: DeepMocked<UserService>;
	let accountService: DeepMocked<AccountService>;
	let roleService: DeepMocked<RoleService>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AdminApiUserUc,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
			],
		}).compile();

		uc = module.get(AdminApiUserUc);
		userService = module.get(UserService);
		accountService = module.get(AccountService);
		roleService = module.get(RoleService);
	});

	describe('createUserAndAccount', () => {
		const setup = () => {
			const schoolId = 'schoolId';
			const firstName = 'firstname';
			const lastName = 'lastName';
			const email = 'mail@domain.de';
			const roleNames = [RoleName.STUDENT];
			const role = roleFactory.buildWithId({ name: RoleName.STUDENT });
			roleService.findByNames.mockResolvedValue([role]);

			const user = userDoFactory.buildWithId();
			userService.save.mockResolvedValue(user);

			const accountDto = accountDoFactory.build();
			accountService.save.mockResolvedValue(accountDto);
			return { schoolId, firstName, lastName, email, roleNames, role, user, accountDto };
		};

		it('should return data', async () => {
			const { schoolId, firstName, lastName, email, roleNames, accountDto, user } = setup();

			const result = await uc.createUserAndAccount({ schoolId, firstName, lastName, email, roleNames });

			expect(result).toEqual(
				expect.objectContaining({
					userId: user.id,
					accountId: accountDto.id,
					username: accountDto.username,
					initialPassword: expect.any(String),
				})
			);
		});

		it('should have persisted user', async () => {
			const { schoolId, firstName, lastName, email, roleNames } = setup();

			await uc.createUserAndAccount({ schoolId, firstName, lastName, email, roleNames });

			expect(userService.save).toHaveBeenCalledWith(
				expect.objectContaining({
					schoolId,
					firstName,
					lastName,
					email,
				})
			);
		});

		it('should have persisted account', async () => {
			const { schoolId, firstName, lastName, email, roleNames, user } = setup();

			await uc.createUserAndAccount({ schoolId, firstName, lastName, email, roleNames });

			expect(accountService.save).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: user.id,
					username: email,
				})
			);
		});
	});
});
