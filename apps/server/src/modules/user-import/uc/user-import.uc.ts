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
	SchoolFeatures,
	System,
	User,
	Permission,
} from '@shared/domain';

import { ImportUserRepo, SystemRepo, UserRepo } from '@shared/repo';
import { Configuration } from '@hpi-schul-cloud/commons';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto/account.dto';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolService } from '../../school';
import {
	LdapAlreadyPersistedException,
	MigrationAlreadyActivatedException,
	MissingSchoolNumberException,
} from './ldap-user-migration.error';

export type UserImportPermissions =
	| Permission.SCHOOL_IMPORT_USERS_MIGRATE
	| Permission.SCHOOL_IMPORT_USERS_UPDATE
	| Permission.SCHOOL_IMPORT_USERS_VIEW;

@Injectable()
export class UserImportUc {
	constructor(
		private readonly accountService: AccountService,
		private readonly importUserRepo: ImportUserRepo,
		private readonly permissionService: PermissionService,
		private readonly schoolService: SchoolService,
		private readonly systemRepo: SystemRepo,
		private readonly userRepo: UserRepo
	) {}

	private checkFeatureEnabled(school: SchoolDO): void | never {
		const enabled = Configuration.get('FEATURE_USER_MIGRATION_ENABLED') as boolean;
		const isLdapPilotSchool = school.features && school.features.includes(SchoolFeatures.LDAP_UNIVENTION_MIGRATION);
		if (!enabled && !isLdapPilotSchool) {
			throw new InternalServerErrorException('User Migration not enabled');
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
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_VIEW);
		const school: SchoolDO = await this.schoolService.getSchoolById(currentUser.school.id);
		this.checkFeatureEnabled(school);
		// TODO Change ImportUserRepo to DO to fix this workaround
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
	async setMatch(currentUserId: EntityId, importUserId: EntityId, userMatchId: EntityId): Promise<ImportUser> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_UPDATE);
		const school: SchoolDO = await this.schoolService.getSchoolById(currentUser.school.id);
		this.checkFeatureEnabled(school);
		const importUser = await this.importUserRepo.findById(importUserId);
		const userMatch = await this.userRepo.findById(userMatchId, true);

		// check same school
		if (!school.id || school.id !== userMatch.school.id || school.id !== importUser.school.id) {
			throw new ForbiddenException('not same school');
		}

		// check user is not already assigned
		const hasMatch = await this.importUserRepo.hasMatch(userMatch);
		if (hasMatch !== null) throw new UserAlreadyAssignedToImportUserError();

		importUser.setMatch(userMatch, MatchCreator.MANUAL);
		await this.importUserRepo.save(importUser);

		return importUser;
	}

	async removeMatch(currentUserId: EntityId, importUserId: EntityId): Promise<ImportUser> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_UPDATE);
		const school: SchoolDO = await this.schoolService.getSchoolById(currentUser.school.id);
		this.checkFeatureEnabled(school);
		const importUser = await this.importUserRepo.findById(importUserId);
		// check same school
		if (school.id !== importUser.school.id) {
			throw new ForbiddenException('not same school');
		}

		importUser.revokeMatch();
		await this.importUserRepo.save(importUser);

		return importUser;
	}

	async updateFlag(currentUserId: EntityId, importUserId: EntityId, flagged: boolean): Promise<ImportUser> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_UPDATE);
		const school: SchoolDO = await this.schoolService.getSchoolById(currentUser.school.id);
		this.checkFeatureEnabled(school);
		const importUser = await this.importUserRepo.findById(importUserId);

		// check same school
		if (school.id !== importUser.school.id) {
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
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_VIEW);
		const school: SchoolDO = await this.schoolService.getSchoolById(currentUser.school.id);
		this.checkFeatureEnabled(school);
		// TODO Change to UserService to fix this workaround
		const unmatchedCountedUsers = await this.userRepo.findWithoutImportUser(currentUser.school, query, options);
		return unmatchedCountedUsers;
	}

	async saveAllUsersMatches(currentUserId: EntityId): Promise<void> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_MIGRATE);
		const school: SchoolDO = await this.schoolService.getSchoolById(currentUser.school.id);
		this.checkFeatureEnabled(school);
		const filters: IImportUserScope = { matches: [MatchCreatorScope.MANUAL, MatchCreatorScope.AUTO] };
		// TODO batch/paginated import?
		const options: IFindOptions<ImportUser> = {};
		// TODO Change ImportUserRepo to DO to fix this workaround
		const [importUsers, total] = await this.importUserRepo.findImportUsers(currentUser.school, filters, options);
		if (total > 0) {
			importUsers.map(async (importUser) => {
				await this.updateUserAndAccount(importUser, school);
			});
			await this.userRepo.flush();
		}
		// TODO Change ImportUserRepo to DO to fix this workaround
		await this.importUserRepo.deleteImportUsersBySchool(currentUser.school);
		await this.endSchoolInUserMigration(currentUserId);
	}

	private async endSchoolInUserMigration(currentUserId: EntityId): Promise<void> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_MIGRATE);
		const school: SchoolDO = await this.schoolService.getSchoolById(currentUser.school.id);
		this.checkFeatureEnabled(school);
		if (!school.externalId || school.inUserMigration !== true || !school.inMaintenanceSince) {
			throw new BadRequestException('School cannot exit from user migration mode');
		}
		school.inUserMigration = false;
		await this.schoolService.save(school);
	}

	async startSchoolInUserMigration(currentUserId: EntityId, useCentralLdap = true): Promise<void> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_MIGRATE);
		const school: SchoolDO = await this.schoolService.getSchoolById(currentUser.school.id);

		this.checkFeatureEnabled(school);
		this.checkSchoolNumber(school, useCentralLdap);
		this.checkSchoolNotInMigration(school);
		await this.checkNoExistingLdapBeforeStart(school);

		school.inUserMigration = true;
		school.inMaintenanceSince = new Date();
		school.externalId = school.officialSchoolNumber;
		if (useCentralLdap) {
			const migrationSystem = await this.getMigrationSystem();
			if (school.systems && !school.systems.includes(migrationSystem.id)) {
				school.systems.push(migrationSystem.id);
			}
		}

		await this.schoolService.save(school);
	}

	async endSchoolInMaintenance(currentUserId: EntityId): Promise<void> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_MIGRATE);
		const school: SchoolDO = await this.schoolService.getSchoolById(currentUser.school.id);
		this.checkFeatureEnabled(school);
		if (school.inUserMigration !== false || !school.inMaintenanceSince || !school.externalId) {
			throw new BadRequestException('Sync cannot be activated for school');
		}
		school.inMaintenanceSince = undefined;
		await this.schoolService.save(school);
	}

	private async getCurrentUser(currentUserId: EntityId, permission: UserImportPermissions): Promise<User> {
		const currentUser = await this.userRepo.findById(currentUserId, true);
		this.permissionService.checkUserHasAllSchoolPermissions(currentUser, [permission]);

		return currentUser;
	}

	private async updateUserAndAccount(importUser: ImportUser, school: SchoolDO): Promise<[User, Account] | undefined> {
		if (!importUser.user || !importUser.loginName || !school.externalId) {
			return;
		}
		const { user } = importUser;
		user.ldapDn = importUser.ldapDn;
		user.externalId = importUser.externalId;

		const account: AccountDto = await this.accountService.findByUserIdOrFail(user.id);

		account.systemId = importUser.system.id;
		account.password = undefined;
		account.username = `${school.externalId}/${importUser.loginName}`;

		await this.userRepo.save(user);
		await this.accountService.save(account);
	}

	private async getMigrationSystem(): Promise<System> {
		const systemId = Configuration.get('FEATURE_USER_MIGRATION_SYSTEM_ID') as string;
		const system = await this.systemRepo.findById(systemId);
		return system;
	}

	private async checkNoExistingLdapBeforeStart(school: SchoolDO): Promise<void> {
		if (school.systems && school.systems?.length > 0) {
			for (const systemId of school.systems) {
				// very unusual to have more than 1 system
				// eslint-disable-next-line no-await-in-loop
				const system: System = await this.systemRepo.findById(systemId);
				if (system.ldapConfig) {
					throw new LdapAlreadyPersistedException();
				}
			}
		}
	}

	private checkSchoolNumber(school: SchoolDO, useCentralLdap: boolean): void | never {
		if (useCentralLdap && !school.officialSchoolNumber) {
			throw new MissingSchoolNumberException();
		}
	}

	private checkSchoolNotInMigration(school: SchoolDO): void | never {
		if (school.inUserMigration !== undefined && school.inUserMigration !== null) {
			throw new MigrationAlreadyActivatedException();
		}
	}
}
