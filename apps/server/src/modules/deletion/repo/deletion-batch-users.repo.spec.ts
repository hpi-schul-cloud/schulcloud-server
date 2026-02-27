import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { DeletionBatchUsersRepo, UserIdsByRole, UsersCountByRole, UserWithRoles } from './deletion-batch-users.repo';

describe(DeletionBatchUsersRepo.name, () => {
	let module: TestingModule;
	let repo: DeletionBatchUsersRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [User, Role] })],
			providers: [DeletionBatchUsersRepo],
		}).compile();

		repo = module.get(DeletionBatchUsersRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});
	});

	describe('countUsersByRole', () => {
		describe('when userIds is empty', () => {
			it('should return an empty array', async () => {
				const result = await repo.countUsersByRole([]);

				expect(result).toEqual([]);
			});
		});

		describe('when userIds do not match any existing users', () => {
			it('should return an empty array', async () => {
				const result: UsersCountByRole[] = await repo.countUsersByRole([new ObjectId().toHexString()]);

				expect(result).toEqual([]);
			});
		});

		describe('when users with roles exist', () => {
			it('should return the count of users grouped by role', async () => {
				const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT });
				const teacherRole = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const student1 = userFactory.buildWithId({ roles: [studentRole] });
				const student2 = userFactory.buildWithId({ roles: [studentRole] });
				const teacher1 = userFactory.buildWithId({ roles: [teacherRole] });

				await em.persist([studentRole, teacherRole, student1, student2, teacher1]).flush();

				const result: UsersCountByRole[] = await repo.countUsersByRole([student1.id, student2.id, teacher1.id]);

				expect(result).toHaveLength(2);
				expect(result).toEqual(
					expect.arrayContaining([
						{ roleName: RoleName.STUDENT, userCount: 2 },
						{ roleName: RoleName.TEACHER, userCount: 1 },
					])
				);
			});
		});
	});

	describe('getUsersByRole', () => {
		describe('when userIds is empty', () => {
			it('should return an empty array', async () => {
				const result = await repo.getUsersByRole([]);

				expect(result).toEqual([]);
			});
		});

		describe('when userIds do not match any existing users', () => {
			it('should return an empty array', async () => {
				const result: UserIdsByRole[] = await repo.getUsersByRole([new ObjectId().toHexString()]);

				expect(result).toEqual([]);
			});
		});

		describe('when users with roles exist', () => {
			it('should return user ids grouped by role', async () => {
				const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT });
				const teacherRole = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const student1 = userFactory.buildWithId({ roles: [studentRole] });
				const student2 = userFactory.buildWithId({ roles: [studentRole] });
				const teacher1 = userFactory.buildWithId({ roles: [teacherRole] });

				await em.persist([studentRole, teacherRole, student1, student2, teacher1]).flush();

				const result = await repo.getUsersByRole([student1.id, student2.id, teacher1.id]);

				const studentEntry = result.find((r) => r.roleName === RoleName.STUDENT);
				const teacherEntry = result.find((r) => r.roleName === RoleName.TEACHER);

				expect(studentEntry?.userIds).toEqual(expect.arrayContaining([student1.id, student2.id]));
				expect(studentEntry?.userIds).toHaveLength(2);
				expect(teacherEntry?.userIds).toEqual(expect.arrayContaining([teacher1.id]));
				expect(teacherEntry?.userIds).toHaveLength(1);
			});
		});
	});

	describe('getUsersWithRoles', () => {
		describe('when userIds is empty', () => {
			it('should return an empty array', async () => {
				const result = await repo.getUsersWithRoles([]);

				expect(result).toEqual([]);
			});
		});

		describe('when userIds do not match any existing users', () => {
			it('should return an empty array', async () => {
				const result: UserWithRoles[] = await repo.getUsersWithRoles([new ObjectId().toHexString()]);

				expect(result).toEqual([]);
			});
		});

		describe('when a user has a single role', () => {
			it('should return each user with their role name', async () => {
				const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT });
				const teacherRole = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const student = userFactory.buildWithId({ roles: [studentRole] });
				const teacher = userFactory.buildWithId({ roles: [teacherRole] });

				await em.persist([studentRole, teacherRole, student, teacher]).flush();

				const result: UserWithRoles[] = await repo.getUsersWithRoles([student.id, teacher.id]);

				expect(result).toHaveLength(2);
				expect(result).toEqual(
					expect.arrayContaining([
						{ id: student.id, roles: [RoleName.STUDENT] },
						{ id: teacher.id, roles: [RoleName.TEACHER] },
					])
				);
			});
		});

		describe('when a user has multiple roles', () => {
			it('should return the user with all their role names', async () => {
				const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT });
				const teacherRole = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const multiRoleUser = userFactory.buildWithId({ roles: [studentRole, teacherRole] });

				await em.persist([studentRole, teacherRole, multiRoleUser]).flush();

				const result: UserWithRoles[] = await repo.getUsersWithRoles([multiRoleUser.id]);

				expect(result).toHaveLength(1);
				expect(result[0].id).toEqual(multiRoleUser.id);

				const sortedResultRoles = [...result[0].roles].sort();
				expect(sortedResultRoles).toEqual([RoleName.STUDENT, RoleName.TEACHER].sort());
			});
		});

		describe('when a user has an orphaned role reference', () => {
			it('should return the user with only the resolvable role names', async () => {
				const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT });
				const ghostRole = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const user = userFactory.buildWithId({ roles: [studentRole, ghostRole] });

				await em.persist([studentRole, ghostRole, user]).flush();
				await em.remove(ghostRole).flush();

				const result: UserWithRoles[] = await repo.getUsersWithRoles([user.id]);

				expect(result).toHaveLength(1);
				expect(result[0].id).toEqual(user.id);
				expect(result[0].roles).toEqual([RoleName.STUDENT]);
			});
		});
	});
});
