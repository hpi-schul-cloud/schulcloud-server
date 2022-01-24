import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserAlreadyAssignedToImportUserError } from '@shared/common';
import {
	EntityId,
	IFindOptions,
	Counted,
	ImportUser,
	IImportUserScope,
	MatchCreator,
	INameMatch,
	User,
} from '@shared/domain';

import { ImportUserRepo, UserRepo } from '@shared/repo';
import { UserImportPermissions } from '../constants';
import { ImportUserAuthorizationService } from '../services/import-user.authorization.service';

@Injectable()
export class UserImportUc {
	constructor(
		private readonly importUserRepo: ImportUserRepo,
		private readonly userRepo: UserRepo,
		private readonly authorizationService: ImportUserAuthorizationService
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
		const user = await this.userRepo.findById(userId);

		const permissions = [UserImportPermissions.VIEW_SCHOOLS_IMPORT_USERS];
		await this.authorizationService.checkUserHasSchoolPermissions(user, permissions);

		const countedImportUsers = await this.importUserRepo.findImportUsers(user.school, query, options);
		return countedImportUsers;
	}

	/**
	 * Update a @User reference of an @ImportUser
	 * @param currentUserId
	 * @param importUserId
	 * @param userId
	 * @returns importuser and matched user
	 */
	async setMatch(currentUserId: EntityId, importUserId: EntityId, userId: EntityId) {
		const currentUser = await this.userRepo.findById(currentUserId);
		const permissions = [UserImportPermissions.UPDATE_SCHOOLS_IMPORT_USERS];
		await this.authorizationService.checkUserHasSchoolPermissions(currentUser, permissions);

		const userMatch = await this.userRepo.findById(userId);
		const importUser = await this.importUserRepo.findById(importUserId);

		// check same school
		if (!currentUser.school || currentUser.school !== userMatch.school || currentUser.school !== importUser.school) {
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
		const currentUser = await this.userRepo.findById(currentUserId);
		const permissions = [UserImportPermissions.UPDATE_SCHOOLS_IMPORT_USERS];
		await this.authorizationService.checkUserHasSchoolPermissions(currentUser, permissions);

		const importUser = await this.importUserRepo.findById(importUserId);

		// check same school
		if (!currentUser.school || currentUser.school !== importUser.school) {
			throw new ForbiddenException('not same school');
		}

		importUser.revokeMatch();
		await this.importUserRepo.persistAndFlush(importUser);

		return importUser;
	}

	async setFlag(currentUserId: EntityId, importUserId: EntityId, flagged: boolean) {
		const currentUser = await this.userRepo.findById(currentUserId);
		const permissions = [UserImportPermissions.UPDATE_SCHOOLS_IMPORT_USERS];
		await this.authorizationService.checkUserHasSchoolPermissions(currentUser, permissions);

		const importUser = await this.importUserRepo.findById(importUserId);

		// check same school
		if (!currentUser.school || currentUser.school !== importUser.school) {
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
	 * @param userId current users id
	 * @param query filters
	 * @param options
	 * @returns
	 */
	async findAllUnmatchedUsers(userId: EntityId, query: INameMatch, options?: IFindOptions<User>): Promise<User[]> {
		const user = await this.userRepo.findById(userId);

		const permissions = [UserImportPermissions.VIEW_SCHOOLS_IMPORT_USERS];
		await this.authorizationService.checkUserHasSchoolPermissions(user, permissions);

		const unmatchedUsers = await this.userRepo.findWithoutImportUser(user.school, query, options);
		return unmatchedUsers;
	}
}
