import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { DeletionBatchUsersRepo, GroupedUserIdsByRoles } from './deletion-batch-users.repo';

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

	describe('groupUserIdsByAllowedRoles', () => {
		describe('when userIds is empty', () => {
			it('should return empty arrays', async () => {
				const result = await repo.groupUserIdsByAllowedRoles([], [RoleName.STUDENT]);

				const expected: GroupedUserIdsByRoles = {
					withAllowedRole: [],
					withoutAllowedRole: [],
				};
				expect(result).toEqual(expected);
			});
		});

		describe('when userIds do not match any existing users', () => {
			it('should return empty arrays', async () => {
				const result = await repo.groupUserIdsByAllowedRoles([new ObjectId().toHexString()], [RoleName.STUDENT]);

				const expected: GroupedUserIdsByRoles = {
					withAllowedRole: [],
					withoutAllowedRole: [],
				};
				expect(result).toEqual(expected);
			});
		});

		describe('when users exist with different roles', () => {
			it('should group users into groups based on allowed roles', async () => {
				const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT });
				const teacherRole = roleFactory.buildWithId({ name: RoleName.TEACHER });
				const adminRole = roleFactory.buildWithId({ name: RoleName.ADMINISTRATOR });

				const student = userFactory.buildWithId({ roles: [studentRole] });
				const teacher = userFactory.buildWithId({ roles: [teacherRole] });
				const admin = userFactory.buildWithId({ roles: [adminRole] });

				await em.persist([studentRole, teacherRole, adminRole, student, teacher, admin]).flush();

				const result = await repo.groupUserIdsByAllowedRoles(
					[student.id, teacher.id, admin.id],
					[RoleName.STUDENT, RoleName.TEACHER]
				);

				expect(result.withAllowedRole.map((u) => u.id)).toEqual(expect.arrayContaining([student.id, teacher.id]));
				expect(result.withAllowedRole).toHaveLength(2);
				expect(result.withoutAllowedRole.map((u) => u.id)).toEqual([admin.id]);
				expect(result.withoutAllowedRole).toHaveLength(1);
			});
		});

		describe('when a user has multiple roles including an allowed one', () => {
			it('should classify the user as valid', async () => {
				const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT });
				const adminRole = roleFactory.buildWithId({ name: RoleName.ADMINISTRATOR });
				const multiRoleUser = userFactory.buildWithId({ roles: [studentRole, adminRole] });

				await em.persist([studentRole, adminRole, multiRoleUser]).flush();

				const result = await repo.groupUserIdsByAllowedRoles([multiRoleUser.id], [RoleName.STUDENT]);

				expect(result.withAllowedRole.map((u) => u.id)).toEqual([multiRoleUser.id]);
				expect(result.withoutAllowedRole).toEqual([]);
			});
		});

		describe('when mixing existing and non-existing userIds', () => {
			it('should only return found users in results', async () => {
				const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT });
				const student = userFactory.buildWithId({ roles: [studentRole] });
				const nonExistentId = new ObjectId().toHexString();

				await em.persist([studentRole, student]).flush();

				const result = await repo.groupUserIdsByAllowedRoles([student.id, nonExistentId], [RoleName.STUDENT]);

				expect(result.withAllowedRole.map((u) => u.id)).toEqual([student.id]);
				expect(result.withoutAllowedRole).toEqual([]);
			});
		});
	});
});
