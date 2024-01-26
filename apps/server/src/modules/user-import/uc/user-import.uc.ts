import { AccountSaveDto } from '@modules/account';
import { AccountService } from '@modules/account/services/account.service';
import { AccountDto } from '@modules/account/services/dto/account.dto';
import { AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { UserAlreadyAssignedToImportUserError } from '@shared/common';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { Account, ImportUser, MatchCreator, SystemEntity, User } from '@shared/domain/entity';
import { IFindOptions, Permission } from '@shared/domain/interface';
import { Counted, EntityId, IImportUserScope, MatchCreatorScope, NameMatch } from '@shared/domain/types';
import { ImportUserRepo, LegacySystemRepo, UserRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import {
	MigrationMayBeCompleted,
	MigrationMayNotBeCompleted,
	SchoolIdDoesNotMatchWithUserSchoolId,
	SchoolInUserMigrationEndLoggable,
	SchoolInUserMigrationStartLoggable,
} from '../loggable';
import { UserImportService } from '../service';
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
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService,
		private readonly systemRepo: LegacySystemRepo,
		private readonly userRepo: UserRepo,
		private readonly logger: Logger,
		private readonly userImportService: UserImportService
	) {
		this.logger.setContext(UserImportUc.name);
	}

	/**
	 * Resolves with current users schools importusers and matched users.
	 * @param currentUserId
	 * @param query
	 * @param options
	 * @returns
	 */
	public async findAllImportUsers(
		currentUserId: EntityId,
		query: IImportUserScope,
		options?: IFindOptions<ImportUser>
	): Promise<Counted<ImportUser[]>> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_VIEW);
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(currentUser.school.id);
		this.userImportService.checkFeatureEnabled(school);
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
	public async setMatch(currentUserId: EntityId, importUserId: EntityId, userMatchId: EntityId): Promise<ImportUser> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_UPDATE);
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(currentUser.school.id);
		this.userImportService.checkFeatureEnabled(school);
		const importUser = await this.importUserRepo.findById(importUserId);
		const userMatch = await this.userRepo.findById(userMatchId, true);

		// check same school
		if (!school.id || school.id !== userMatch.school.id || school.id !== importUser.school.id) {
			this.logger.warning(
				new SchoolIdDoesNotMatchWithUserSchoolId(userMatch.school.id, importUser.school.id, school.id)
			);
			throw new ForbiddenException('not same school');
		}

		// check user is not already assigned
		const hasMatch = await this.importUserRepo.hasMatch(userMatch);
		if (hasMatch !== null) throw new UserAlreadyAssignedToImportUserError();

		importUser.setMatch(userMatch, MatchCreator.MANUAL);
		await this.importUserRepo.save(importUser);

		return importUser;
	}

	public async removeMatch(currentUserId: EntityId, importUserId: EntityId): Promise<ImportUser> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_UPDATE);
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(currentUser.school.id);
		this.userImportService.checkFeatureEnabled(school);
		const importUser = await this.importUserRepo.findById(importUserId);
		// check same school
		if (school.id !== importUser.school.id) {
			this.logger.warning(new SchoolIdDoesNotMatchWithUserSchoolId('', importUser.school.id, school.id));
			throw new ForbiddenException('not same school');
		}

		importUser.revokeMatch();
		await this.importUserRepo.save(importUser);

		return importUser;
	}

	public async updateFlag(currentUserId: EntityId, importUserId: EntityId, flagged: boolean): Promise<ImportUser> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_UPDATE);
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(currentUser.school.id);
		this.userImportService.checkFeatureEnabled(school);
		const importUser = await this.importUserRepo.findById(importUserId);

		// check same school
		if (school.id !== importUser.school.id) {
			this.logger.warning(new SchoolIdDoesNotMatchWithUserSchoolId('', importUser.school.id, school.id));
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
	public async findAllUnmatchedUsers(
		currentUserId: EntityId,
		query: NameMatch,
		options?: IFindOptions<User>
	): Promise<Counted<User[]>> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_VIEW);
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(currentUser.school.id);
		this.userImportService.checkFeatureEnabled(school);
		// TODO Change to UserService to fix this workaround
		const unmatchedCountedUsers = await this.userRepo.findWithoutImportUser(currentUser.school, query, options);
		return unmatchedCountedUsers;
	}

	public async saveAllUsersMatches(currentUserId: EntityId): Promise<void> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_MIGRATE);
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(currentUser.school.id);
		this.userImportService.checkFeatureEnabled(school);
		const filters: IImportUserScope = { matches: [MatchCreatorScope.MANUAL, MatchCreatorScope.AUTO] };
		// TODO batch/paginated import?
		const options: IFindOptions<ImportUser> = {};
		// TODO Change ImportUserRepo to DO to fix this workaround
		const [importUsers, total] = await this.importUserRepo.findImportUsers(currentUser.school, filters, options);
		let migratedUser = 0;
		if (total > 0) {
			this.logger.notice({
				getLogMessage: () => {
					return {
						message: 'start saving all matched users',
						numberOfMatchedUser: total,
					};
				},
			});
			for (const importUser of importUsers) {
				// TODO: Find a better solution for this loop
				// this needs to be synchronous, because otherwise it was leading to
				// server crush when working with larger number of users (e.g. 1000)
				// eslint-disable-next-line no-await-in-loop
				await this.updateUserAndAccount(importUser, school);
				migratedUser += 1;
			}
		}
		this.logger.notice({
			getLogMessage: () => {
				return {
					message: 'number of already migrated users from the total number',
					numberOfMigratedUser: `${migratedUser}/${total}`,
				};
			},
		});
		// TODO Change ImportUserRepo to DO to fix this workaround
		// Delete all remaining importUser-objects that dont need to be ported
		await this.importUserRepo.deleteImportUsersBySchool(currentUser.school);
		await this.endSchoolInUserMigration(currentUserId);
	}

	private async endSchoolInUserMigration(currentUserId: EntityId): Promise<void> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_MIGRATE);
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(currentUser.school.id);
		this.userImportService.checkFeatureEnabled(school);
		if (!school.externalId || school.inUserMigration !== true || !school.inMaintenanceSince) {
			this.logger.warning(new MigrationMayBeCompleted(school.inUserMigration));
			throw new BadRequestException('School cannot exit from user migration mode');
		}
		school.inUserMigration = false;
		await this.schoolService.save(school);
	}

	public async startSchoolInUserMigration(currentUserId: EntityId, useCentralLdap = true): Promise<void> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_MIGRATE);
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(currentUser.school.id);
		this.logger.notice(new SchoolInUserMigrationStartLoggable(currentUserId, school.name, useCentralLdap));
		this.userImportService.checkFeatureEnabled(school);
		this.checkSchoolNumber(school, useCentralLdap);
		this.checkSchoolNotInMigration(school);
		await this.checkNoExistingLdapBeforeStart(school);

		school.inUserMigration = true;
		school.inMaintenanceSince = new Date();
		school.externalId = school.officialSchoolNumber;
		if (useCentralLdap) {
			const migrationSystem = await this.userImportService.getMigrationSystem();
			if (school.systems && !school.systems.includes(migrationSystem.id)) {
				school.systems.push(migrationSystem.id);
			}
		}

		await this.schoolService.save(school);
	}

	public async endSchoolInMaintenance(currentUserId: EntityId): Promise<void> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.SCHOOL_IMPORT_USERS_MIGRATE);
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(currentUser.school.id);
		this.userImportService.checkFeatureEnabled(school);
		if (school.inUserMigration !== false || !school.inMaintenanceSince || !school.externalId) {
			this.logger.warning(new MigrationMayNotBeCompleted(school.inUserMigration));
			throw new BadRequestException('Sync cannot be activated for school');
		}
		school.inMaintenanceSince = undefined;
		await this.schoolService.save(school);
		this.logger.notice(new SchoolInUserMigrationEndLoggable(school.name));
	}

	private async getCurrentUser(currentUserId: EntityId, permission: UserImportPermissions): Promise<User> {
		const currentUser = await this.userRepo.findById(currentUserId, true);
		this.authorizationService.checkAllPermissions(currentUser, [permission]);

		return currentUser;
	}

	private async updateUserAndAccount(
		importUser: ImportUser,
		school: LegacySchoolDo
	): Promise<[User, Account] | undefined> {
		if (!importUser.user || !importUser.loginName || !school.externalId) {
			return;
		}
		const { user } = importUser;
		user.ldapDn = importUser.ldapDn;
		user.externalId = importUser.externalId;

		const account: AccountDto = await this.getAccount(user);

		account.systemId = importUser.system.id;
		account.password = undefined;
		account.username = `${school.externalId}/${importUser.loginName}`.toLowerCase();

		await this.userRepo.save(user);
		await this.accountService.save(account);
		await this.importUserRepo.delete(importUser);
	}

	private async getAccount(user: User): Promise<AccountDto> {
		let account: AccountDto | null = await this.accountService.findByUserId(user.id);

		if (!account) {
			const newAccount: AccountSaveDto = new AccountSaveDto({
				userId: user.id,
				username: user.email,
			});

			await this.accountService.saveWithValidation(newAccount);
			account = await this.accountService.findByUserIdOrFail(user.id);
		}
		return account;
	}

	private async checkNoExistingLdapBeforeStart(school: LegacySchoolDo): Promise<void> {
		if (school.systems && school.systems?.length > 0) {
			for (const systemId of school.systems) {
				// very unusual to have more than 1 system
				// eslint-disable-next-line no-await-in-loop
				const system: SystemEntity = await this.systemRepo.findById(systemId);
				if (system.ldapConfig) {
					throw new LdapAlreadyPersistedException();
				}
			}
		}
	}

	private checkSchoolNumber(school: LegacySchoolDo, useCentralLdap: boolean): void | never {
		if (useCentralLdap && !school.officialSchoolNumber) {
			throw new MissingSchoolNumberException();
		}
	}

	private checkSchoolNotInMigration(school: LegacySchoolDo): void | never {
		if (school.inUserMigration !== undefined && school.inUserMigration !== null) {
			throw new MigrationAlreadyActivatedException();
		}
	}
}
