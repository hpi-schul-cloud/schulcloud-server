import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { UserAlreadyAssignedToImportUserError } from '@shared/common';
import {
	Account,
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
	System,
	User,
} from '@shared/domain';

import { AccountRepo, ImportUserRepo, SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ObjectId } from '@mikro-orm/mongodb';
import { UserImportPermissions } from '../constants';

@Injectable()
export class UserImportUc {
	constructor(
		private readonly accountRepo: AccountRepo,
		private readonly importUserRepo: ImportUserRepo,
		private readonly permissionService: PermissionService,
		private readonly schoolRepo: SchoolRepo,
		private readonly systemRepo: SystemRepo,
		private readonly userRepo: UserRepo
	) {}

	private featureEnabled() {
		const enabled = Configuration.get('FEATURE_USER_MIGRATION_ENABLED') as boolean;
		const systemId = Configuration.get('FEATURE_USER_MIGRATION_SYSTEM_ID') as string;
		if (!enabled || !ObjectId.isValid(systemId)) {
			throw new InternalServerErrorException('User Migration not configured');
		}
	}

	/**
	 * Resolves with current users schools importusers and matched users.
	 * @param currentUserId
	 * @param query
	 * @param options
	 * @returns
	 */
	async findAllImportUsers(
		currentUserId: EntityId,
		query: IImportUserScope,
		options?: IFindOptions<ImportUser>
	): Promise<Counted<ImportUser[]>> {
		this.featureEnabled();
		const currentUser = await this.getCurrentUser(currentUserId, UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW);
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
		this.featureEnabled();
		const currentUser = await this.getCurrentUser(currentUserId, UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE);
		const importUser = await this.importUserRepo.findById(importUserId);
		const userMatch = await this.userRepo.findById(userMatchId, true);

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
		await this.importUserRepo.save(importUser);

		return importUser;
	}

	async removeMatch(currentUserId: EntityId, importUserId: EntityId) {
		this.featureEnabled();
		const currentUser = await this.getCurrentUser(currentUserId, UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE);
		const importUser = await this.importUserRepo.findById(importUserId);
		// check same school
		if (currentUser.school.id !== importUser.school.id) {
			throw new ForbiddenException('not same school');
		}

		importUser.revokeMatch();
		await this.importUserRepo.save(importUser);

		return importUser;
	}

	async updateFlag(currentUserId: EntityId, importUserId: EntityId, flagged: boolean) {
		this.featureEnabled();
		const currentUser = await this.getCurrentUser(currentUserId, UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE);
		const importUser = await this.importUserRepo.findById(importUserId);

		// check same school
		if (currentUser.school.id !== importUser.school.id) {
			throw new ForbiddenException('not same school');
		}

		importUser.flagged = flagged === true;
		await this.importUserRepo.save(importUser);

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
		this.featureEnabled();
		const currentUser = await this.getCurrentUser(currentUserId, UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW);
		const unmatchedCountedUsers = await this.userRepo.findWithoutImportUser(currentUser.school, query, options);
		return unmatchedCountedUsers;
	}

	async saveAllUsersMatches(currentUserId: EntityId): Promise<void> {
		this.featureEnabled();
		const currentUser = await this.getCurrentUser(currentUserId, UserImportPermissions.SCHOOL_IMPORT_USERS_MIGRATE);
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
		await this.endSchoolInUserMigration(currentUserId);
	}

	private async endSchoolInUserMigration(currentUserId: EntityId): Promise<void> {
		this.featureEnabled();
		const currentUser = await this.getCurrentUser(currentUserId, UserImportPermissions.SCHOOL_IMPORT_USERS_MIGRATE);
		const { school } = currentUser;
		if (!school.ldapSchoolIdentifier || school.inUserMigration !== true || !school.inMaintenanceSince) {
			throw new BadRequestException('School cannot exit from user migration mode');
		}
		school.inUserMigration = false;
		await this.schoolRepo.save(school);
	}

	async startSchoolInUserMigration(currentUserId: EntityId): Promise<void> {
		this.featureEnabled();
		const migrationSystem = await this.getMigrationSystem();
		const currentUser = await this.getCurrentUser(currentUserId, UserImportPermissions.SCHOOL_IMPORT_USERS_MIGRATE);
		const { school } = currentUser;
		if (!school.officialSchoolNumber || (school.inUserMigration !== undefined && school.inUserMigration !== null)) {
			throw new BadRequestException('School cannot be set in user migration');
		}

		school.inUserMigration = true;
		school.inMaintenanceSince = new Date();
		school.ldapSchoolIdentifier = school.officialSchoolNumber;
		if (!school.systems.contains(migrationSystem)) {
			school.systems.add(migrationSystem);
		}

		await this.schoolRepo.save(school);
	}

	async endSchoolInMaintenance(currentUserId: EntityId): Promise<void> {
		this.featureEnabled();
		const currentUser = await this.getCurrentUser(currentUserId, UserImportPermissions.SCHOOL_IMPORT_USERS_MIGRATE);
		const { school } = currentUser;
		if (school.inUserMigration !== false || !school.inMaintenanceSince || !school.ldapSchoolIdentifier) {
			throw new BadRequestException('Sync cannot be activated for school');
		}
		school.inMaintenanceSince = undefined;
		await this.schoolRepo.save(school);
	}

	private async getCurrentUser(currentUserId: EntityId, permission: UserImportPermissions): Promise<User> {
		const currentUser = await this.userRepo.findById(currentUserId, true);
		this.permissionService.checkUserHasAllSchoolPermissions(currentUser, [permission]);

		return currentUser;
	}

	private async updateUserAndAccount(importUser: ImportUser, school: School): Promise<[User, Account] | undefined> {
		if (!importUser.user || !importUser.loginName || !school.ldapSchoolIdentifier) {
			return;
		}
		const { user } = importUser;
		user.ldapId = importUser.ldapId;

		const account = await this.accountRepo.findOneByUser(user);
		account.system = this.accountRepo.getObjectReference(System, importUser.system.id);
		account.password = undefined;
		account.username = `${school.ldapSchoolIdentifier}/${importUser.loginName}`;

		this.userRepo.saveWithoutFlush(user);
		this.accountRepo.saveWithoutFlush(account);
	}

	private async getMigrationSystem(): Promise<System> {
		const systemId = Configuration.get('FEATURE_USER_MIGRATION_SYSTEM_ID') as string;
		const system = await this.systemRepo.findById(systemId);
		return system;
	}
}
