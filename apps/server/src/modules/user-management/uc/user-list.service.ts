import { RoleDto } from '@modules/role';
import { School } from '@modules/school';
import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';
import { ClassService } from '@src/modules/class';
import { Class } from '@src/modules/class/domain';
import { User } from '../domain/user';
import { UserMikroOrmRepo } from '../repo/user.repo';
import { USER_REPO } from './interface/user.repo.interface';
import { UserListQuery } from './query/user-list.query';
import { SortableField } from './type/sortable-field';

@Injectable()
export class UserListService {
	constructor(
		@Inject(USER_REPO) private readonly userRepo: UserMikroOrmRepo,
		private readonly classService: ClassService
	) {}

	public async getAndCountUsersByClasses(
		query: UserListQuery,
		school: School,
		role: RoleDto
	): Promise<[User[], number]> {
		if (!query.classIds) {
			throw new Error('The query must contain classIds for this method.');
		}

		// If the results should not be sorted by class, the order of the classes is irrelevant. We just set it to ascending.
		const sortOrder = query.sortBy === SortableField.class ? query.sortOrder : 1;
		const classes = await this.classService.getClassesByIds(query.classIds, sortOrder);
		const userIds = this.extractUserIdsFromClasses(classes, role);
		const totalNumberOfUsers = userIds.length;

		let users: User[] = [];

		if (query.sortBy === SortableField.class) {
			users = await this.userRepo.getUsersByIdsInOrderOfIds(userIds, query);
		} else {
			users = await this.userRepo.getUsersByIds(userIds, school, role, query);
		}

		this.addClassesToUsers(users, classes);

		return [users, totalNumberOfUsers];
	}

	public async getAndCountUsersSortedByClass(
		query: UserListQuery,
		school: School,
		role: RoleDto
	): Promise<[User[], number]> {
		const classes = await this.classService.findClassesForSchool(school.id, query.sortOrder);
		const idsOfUsersWithClasses = this.extractUserIdsFromClasses(classes, role);

		let users: User[] = [];

		if (query.sortOrder === -1) {
			users = await this.getUsersSortedByClassDescendingly(idsOfUsersWithClasses, query, classes, school, role);
		} else {
			users = await this.getUsersSortedByClassAscendingly(idsOfUsersWithClasses, query, classes, school, role);
		}

		const total = await this.userRepo.countUsers(school, role);

		return [users, total];
	}

	public async getAndCountUsers(query: UserListQuery, school: School, role: RoleDto): Promise<[User[], number]> {
		const [users, total] = await this.userRepo.getAndCountUsersBySchoolAndRole(school, role, query);
		const classes = await this.classService.findClassesForSchool(school.id, query.sortOrder);

		this.addClassesToUsers(users, classes);

		return [users, total];
	}

	private extractUserIdsFromClasses(classes: Class[], role: RoleDto): string[] {
		let userIds: string[] = [];

		if (role.name === RoleName.STUDENT) {
			userIds = classes.flatMap((c) => c.userIds);
		} else if (role.name === RoleName.TEACHER) {
			userIds = classes.flatMap((c) => c.teacherIds);
		} else {
			throw new NotImplementedException(`user-list is not implemented for role ${role.name}.`);
		}

		const uniqueUserIds = Array.from(new Set(userIds));

		return uniqueUserIds;
	}

	private addClassesToUsers(users: User[], classes: Class[]): void {
		users.forEach((u) => {
			classes.forEach((c) => {
				if (c.isClassOfUser(u.id)) {
					u.addClass(c);
				}
			});
		});
	}

	private async getUsersSortedByClassDescendingly(
		idsOfUsersWithClasses: string[],
		query: UserListQuery,
		classes: Class[],
		school: School,
		role: RoleDto
	) {
		let users: User[] = [];

		const usersWithClasses = await this.userRepo.getUsersByIdsInOrderOfIds(idsOfUsersWithClasses, query);
		this.addClassesToUsers(usersWithClasses, classes);

		if (usersWithClasses.length < query.limit) {
			users = await this.addUsersWithoutClasses(query, usersWithClasses, idsOfUsersWithClasses, school, role);
		} else {
			users = usersWithClasses;
		}

		return users;
	}

	private async getUsersSortedByClassAscendingly(
		idsOfUsersWithClasses: string[],
		query: UserListQuery,
		classes: Class[],
		school: School,
		role: RoleDto
	) {
		let users: User[] = [];

		const [usersWithoutClasses, numberOfUsersWithoutClasses] = await this.userRepo.getAndCountUsersExceptWithIds(
			idsOfUsersWithClasses,
			school,
			role,
			query
		);

		if (usersWithoutClasses.length < query.limit) {
			users = await this.addUsersWithClasses(
				query,
				usersWithoutClasses,
				numberOfUsersWithoutClasses,
				idsOfUsersWithClasses,
				classes
			);
		} else {
			users = usersWithoutClasses;
		}

		return users;
	}

	private async addUsersWithoutClasses(
		query: UserListQuery,
		usersWithClasses: User[],
		idsOfUsersWithClasses: string[],
		school: School,
		role: RoleDto
	) {
		const limit = query.limit - usersWithClasses.length;
		const offset = 0;
		const [usersWithoutClasses] = await this.userRepo.getAndCountUsersExceptWithIds(
			idsOfUsersWithClasses,
			school,
			role,
			query,
			limit,
			offset
		);
		const users = usersWithClasses.concat(usersWithoutClasses);

		return users;
	}

	private async addUsersWithClasses(
		query: UserListQuery,
		usersWithoutClasses: User[],
		numberOfUsersWithoutClasses: number,
		idsOfUsersWithClasses: string[],
		classes: Class[]
	) {
		const limit = query.limit - usersWithoutClasses.length;
		let offset = 0;

		if (numberOfUsersWithoutClasses < query.offset) {
			offset = query.offset - numberOfUsersWithoutClasses;
		}

		const usersWithClasses = await this.userRepo.getUsersByIdsInOrderOfIds(idsOfUsersWithClasses, query, limit, offset);
		this.addClassesToUsers(usersWithClasses, classes);

		const users = usersWithoutClasses.concat(usersWithClasses);

		return users;
	}
}
