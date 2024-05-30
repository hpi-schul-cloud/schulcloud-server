import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { Class } from '../domain/class';
import { User } from '../domain/user';
import { ClassMikroOrmRepo } from '../repo/class.repo';
import { RoleMikroOrmRepo } from '../repo/role.repo';
import { UserMikroOrmRepo } from '../repo/user.repo';
import { CLASS_REPO } from './interface/class.repo.interface';
import { ROLE_REPO } from './interface/role.repo.interface';
import { USER_REPO } from './interface/user.repo.interface';
import { UserListDtoMapper } from './mapper/user-list.dto.mapper';
import { UserListQuery } from './query/user-list.query';
import { RequestableRoleName } from './type/requestable-role-name';
import { SortableField } from './type/sortable-field';

@Injectable()
export class GetUserListUc {
	constructor(
		@Inject(USER_REPO) private readonly userRepo: UserMikroOrmRepo,
		@Inject(CLASS_REPO) private readonly classRepo: ClassMikroOrmRepo,
		@Inject(ROLE_REPO) private readonly roleRepo: RoleMikroOrmRepo
	) {}

	public async execute(query: UserListQuery) {
		// TODO: authorization

		const roleName = await this.roleRepo.getNameForId(query.roleId);
		if (roleName !== RequestableRoleName.STUDENT && roleName !== RequestableRoleName.TEACHER) {
			throw new NotImplementedException(`user-list is not implemented for role ${roleName}.`);
		}

		const { limit, offset } = query;

		let users: User[] = [];
		let total = 0;

		// The following distinction is for performance reasons.
		// If the results shall be filtered or sorted by class, we cannot paginate the users before attaching the classes.
		// To load all users and then attach the classes is too slow. Thus we only load the needed users from the classes and paginate afterwards.
		if (query.classIds) {
			[users, total] = await this.getAndCountUsersByClasses(query);
		} else if (query.sortBy === SortableField.class) {
			[users, total] = await this.getAndCountUsersSortedByClass(query);
		} else {
			[users, total] = await this.getAndCountUsers(query);
		}

		const dto = UserListDtoMapper.mapToDto(users, limit, offset, total);

		return dto;
	}

	private async getAndCountUsersByClasses(query: UserListQuery): Promise<[User[], number]> {
		if (!query.classIds) {
			throw new Error('The query must contain classIds for this method.');
		}

		// If the results should not be sorted by class, the order of the classes is irrelevant. We just set it to ascending.
		const sortOrder = query.sortBy === SortableField.class ? query.sortOrder : 1;
		const classes = await this.classRepo.getClassesByIds(query.classIds, sortOrder);
		const userIds = await this.extractUserIdsFromClasses(classes, query);
		const totalNumberOfUsers = userIds.length;

		let users: User[] = [];

		if (query.sortBy === SortableField.class) {
			users = await this.userRepo.getUsersByIdsInOrderOfIds(userIds, query);
		} else {
			users = await this.userRepo.getUsersByIds(userIds, query);
		}

		this.addClassesToUsers(users, classes);

		return [users, totalNumberOfUsers];
	}

	private async getAndCountUsersSortedByClass(query: UserListQuery): Promise<[User[], number]> {
		const classes = await this.classRepo.getClassesForSchool(query.schoolId, query.sortOrder);
		const idsOfUsersWithClasses = await this.extractUserIdsFromClasses(classes, query);

		let users: User[] = [];

		if (query.sortOrder === -1) {
			users = await this.getUsersSortedByClassDescendingly(idsOfUsersWithClasses, query, classes);
		} else {
			users = await this.getUsersSortedByClassAscendingly(idsOfUsersWithClasses, query, classes);
		}

		const total = await this.userRepo.countUsers(query);

		return [users, total];
	}

	private async getAndCountUsers(query: UserListQuery): Promise<[User[], number]> {
		const [users, total] = await this.userRepo.getAndCountUsers(query);
		const classes = await this.classRepo.getClassesForSchool(query.schoolId);

		this.addClassesToUsers(users, classes);

		return [users, total];
	}

	private async extractUserIdsFromClasses(classes: Class[], query: UserListQuery): Promise<string[]> {
		const roleName = await this.roleRepo.getNameForId(query.roleId);

		let userIds: string[] = [];

		if (roleName === RequestableRoleName.STUDENT) {
			userIds = classes.flatMap((c) => c.getStudentIds());
		} else if (roleName === RequestableRoleName.TEACHER) {
			userIds = classes.flatMap((c) => c.getTeacherIds());
		} else {
			throw new NotImplementedException(`user-list is not implemented for role ${roleName}.`);
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
		classes: Class[]
	) {
		let users: User[] = [];

		const usersWithClasses = await this.userRepo.getUsersByIdsInOrderOfIds(idsOfUsersWithClasses, query);
		this.addClassesToUsers(usersWithClasses, classes);

		if (usersWithClasses.length < query.limit) {
			users = await this.addUsersWithoutClasses(query, usersWithClasses, idsOfUsersWithClasses);
		} else {
			users = usersWithClasses;
		}

		return users;
	}

	private async getUsersSortedByClassAscendingly(
		idsOfUsersWithClasses: string[],
		query: UserListQuery,
		classes: Class[]
	) {
		let users: User[] = [];

		const [usersWithoutClasses, numberOfUsersWithoutClasses] = await this.userRepo.getAndCountUsersExceptWithIds(
			idsOfUsersWithClasses,
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
		idsOfUsersWithClasses: string[]
	) {
		const limit = query.limit - usersWithClasses.length;
		const offset = 0;
		const [usersWithoutClasses] = await this.userRepo.getAndCountUsersExceptWithIds(
			idsOfUsersWithClasses,
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
