import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserAlreadyAssignedToImportUserError } from '@shared/common';
import {
	Counted,
	EntityId,
	IFindOptions,
	IImportUserScope,
	ImportUser,
	INameMatch,
	MatchCreator,
	MatchCreatorScope,
	PermissionService,
	School,
	User,
} from '@shared/domain';

import { ImportUserRepo, SchoolRepo, UserRepo, AccountRepo } from '@shared/repo';
import { UserImportPermissions } from '../constants';

@Injectable()
export class UserImportUc {
	constructor(
		private readonly accountRepo: AccountRepo,
		private readonly importUserRepo: ImportUserRepo,
		private readonly permissionService: PermissionService,
		private readonly schoolRepo: SchoolRepo,
		private readonly userRepo: UserRepo
	) {}

	/**
	 * Resolves with current users schools importusers and matched users.
	 * @param userId
	 * @param query
	 * @param options
	 * @returns
	 */
	async findAllImportUsers(
		userId: EntityId,
		query: IImportUserScope,
		options?: IFindOptions<ImportUser>
	): Promise<Counted<ImportUser[]>> {
		const currentUser = await this.userRepo.findById(userId, true);

		const permissions = [UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW];
		this.permissionService.checkUserHasAllSchoolPermissions(currentUser, permissions);

		const countedImportUsers = await this.importUserRepo.findImportUsers(currentUser.school, query, options);
		return countedImportUsers;
	}

	/**
	 * Update a @User reference of an @ImportUser
	 * @param currentUserId
	 * @param importUserId
	 * @param userMatchId
	 * @returns importuser and matched user
	 */
	async setMatch(currentUserId: EntityId, importUserId: EntityId, userMatchId: EntityId) {
		const currentUser = await this.userRepo.findById(currentUserId, true);
		const permissions = [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE];
		this.permissionService.checkUserHasAllSchoolPermissions(currentUser, permissions);

		const userMatch = await this.userRepo.findById(userMatchId, true);
		const importUser = await this.importUserRepo.findById(importUserId);

		// check same school
		if (
			!currentUser.school.id ||
			currentUser.school.id !== userMatch.school.id ||
			currentUser.school.id !== importUser.school.id
		) {
			throw new ForbiddenException('not same school');
		}

		// check user is not already assigned
		const hasMatch = await this.importUserRepo.hasMatch(userMatch);
		if (hasMatch !== null) throw new UserAlreadyAssignedToImportUserError();

		importUser.setMatch(userMatch, MatchCreator.MANUAL);
		await this.importUserRepo.persistAndFlush(importUser);

		return importUser;
	}

	async removeMatch(currentUserId: EntityId, importUserId: EntityId) {
		const currentUser = await this.userRepo.findById(currentUserId, true);
		const permissions = [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE];
		this.permissionService.checkUserHasAllSchoolPermissions(currentUser, permissions);

		const importUser = await this.importUserRepo.findById(importUserId);
		// check same school
		if (currentUser.school.id !== importUser.school.id) {
			throw new ForbiddenException('not same school');
		}

		importUser.revokeMatch();
		await this.importUserRepo.persistAndFlush(importUser);

		return importUser;
	}

	async updateFlag(currentUserId: EntityId, importUserId: EntityId, flagged: boolean) {
		const currentUser = await this.userRepo.findById(currentUserId, true);
		const permissions = [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE];
		this.permissionService.checkUserHasAllSchoolPermissions(currentUser, permissions);

		const importUser = await this.importUserRepo.findById(importUserId);

		// check same school
		if (currentUser.school.id !== importUser.school.id) {
			throw new ForbiddenException('not same school');
		}

		importUser.flagged = flagged === true;
		await this.importUserRepo.persistAndFlush(importUser);

		return importUser;
	}

	/**
	 * Returns a list of users wich is not assigned as match to importusers.
	 * The result will filter by curernt users school by default.
	 * The current user must have permission to read schools users and view importusers.
	 * @param currentUserId
	 * @param query filters
	 * @param options
	 * @returns
	 */
	async findAllUnmatchedUsers(
		currentUserId: EntityId,
		query: INameMatch,
		options?: IFindOptions<User>
	): Promise<Counted<User[]>> {
		const currentUser = await this.userRepo.findById(currentUserId, true);

		const permissions = [UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW];
		this.permissionService.checkUserHasAllSchoolPermissions(currentUser, permissions);

		const unmatchedCountedUsers = await this.userRepo.findWithoutImportUser(currentUser.school, query, options);
		return unmatchedCountedUsers;
	}

	async saveAllUsersMatches(currentUserId: EntityId): Promise<void> {
		const currentUser = await this.userRepo.findById(currentUserId, true);

		const permissions = [UserImportPermissions.SCHOOL_IMPORT_USERS_MIGRATE];
		this.permissionService.checkUserHasAllSchoolPermissions(currentUser, permissions);

		const { school } = currentUser;

		const filters: IImportUserScope = { matches: [MatchCreatorScope.MANUAL, MatchCreatorScope.AUTO] };
		// TODO batch/paginated import?
		const options: IFindOptions<ImportUser> = {};
		const [importUsers, total] = await this.importUserRepo.findImportUsers(school, filters, options);
		if (total > 0) {
			importUsers.map(async (importUser) => {
				await this.updateUserAndAccount(importUser, school);
			});
			await this.userRepo.flush();
			await this.accountRepo.flush();
		}

		await this.importUserRepo.deleteImportUsersBySchool(school);

		school.inUserMigration = false;
		await this.schoolRepo.persistAndFlush(school);
	}

	private async updateUserAndAccount(importUser: ImportUser, school: School) {
		if (!importUser.user || !importUser.loginName || !school.ldapSchoolIdentifier) {
			return;
		}
		importUser.user.ldapId = importUser.ldapId;
		this.userRepo.persist(importUser.user);

		const account = await this.accountRepo.findOneByUser(importUser.user);
		account.systemId = importUser.system._id;
		account.password = undefined;
		account.username = `${school.ldapSchoolIdentifier}/${importUser.loginName}`;
		this.accountRepo.persist(account);
	}
}
