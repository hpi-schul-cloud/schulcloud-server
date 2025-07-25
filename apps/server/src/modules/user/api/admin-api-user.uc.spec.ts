import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { RoleName, RoleService } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { SchoolEntity } from '@modules/school/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ObjectId } from 'bson';
import { UserService } from '../domain/service/user.service';
import { User, UserMikroOrmRepo } from '../repo';
import { userDoFactory, userFactory } from '../testing';
import { AdminApiUserUc } from './admin-api-user.uc';

describe('admin api user uc', () => {
	let module: TestingModule;
	let uc: AdminApiUserUc;
	let userService: DeepMocked<UserService>;
	let accountService: DeepMocked<AccountService>;
	let roleService: DeepMocked<RoleService>;
	let userRepo: DeepMocked<UserMikroOrmRepo>;
	let courseService: DeepMocked<CourseService>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, SchoolEntity]);

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
				{
					provide: UserMikroOrmRepo,
					useValue: createMock<UserMikroOrmRepo>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
			],
		}).compile();

		uc = module.get(AdminApiUserUc);
		userService = module.get(UserService);
		accountService = module.get(AccountService);
		roleService = module.get(RoleService);
		userRepo = module.get(UserMikroOrmRepo);
		courseService = module.get(CourseService);
	});

	describe('createUserAndAccount', () => {
		describe('When creating an user and account', () => {
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

		describe('when creating a user as a teacher of a course', () => {
			const setup = () => {
				const schoolId = 'schoolId';
				const firstName = 'firstname';
				const lastName = 'lastName';
				const email = 'mail@domain.de';
				const courseId = new ObjectId().toHexString();
				const roleNames = [RoleName.TEACHER];
				const role = roleFactory.buildWithId({ name: RoleName.TEACHER });
				roleService.findByNames.mockResolvedValue([role]);

				const user = userDoFactory.buildWithId();
				userService.save.mockResolvedValue(user);

				const accountDto = accountDoFactory.build();
				accountService.save.mockResolvedValue(accountDto);

				const course = courseEntityFactory.build();
				courseService.findById.mockResolvedValueOnce(course);

				const courseUser = userFactory.build();
				userRepo.findById.mockResolvedValueOnce(courseUser);

				return { schoolId, firstName, lastName, email, roleNames, role, user, courseId, course, courseUser };
			};

			it('assigns the user to teachers of the course', async () => {
				const { schoolId, firstName, lastName, email, roleNames, courseId, course, courseUser } = setup();

				await uc.createUserAndAccount({ schoolId, firstName, lastName, email, roleNames, courseId });

				course.teachers.add(courseUser);
				expect(courseService.save).toHaveBeenCalledWith(course);
			});
		});

		describe('when creating a user as a student of a course', () => {
			const setup = () => {
				const schoolId = 'schoolId';
				const firstName = 'firstname';
				const lastName = 'lastName';
				const email = 'mail@domain.de';
				const courseId = new ObjectId().toHexString();
				const roleNames = [RoleName.STUDENT];
				const role = roleFactory.buildWithId({ name: RoleName.STUDENT });
				roleService.findByNames.mockResolvedValue([role]);

				const user = userDoFactory.buildWithId();
				userService.save.mockResolvedValue(user);

				const accountDto = accountDoFactory.build();
				accountService.save.mockResolvedValue(accountDto);

				const course = courseEntityFactory.build();
				courseService.findById.mockResolvedValueOnce(course);

				const courseUser = userFactory.build();
				userRepo.findById.mockResolvedValueOnce(courseUser);

				return { schoolId, firstName, lastName, email, roleNames, role, user, courseId, course, courseUser };
			};

			it('assigns the user to the students of the course', async () => {
				const { schoolId, firstName, lastName, email, roleNames, courseId, course, courseUser } = setup();

				await uc.createUserAndAccount({ schoolId, firstName, lastName, email, roleNames, courseId });

				course.students.add(courseUser);
				expect(courseService.save).toHaveBeenCalledWith(course);
			});
		});
	});
});
