import { Logger } from '@core/logger';
import { Account, AccountSave, AccountService } from '@modules/account';
import { AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { SystemService } from '@modules/system';
import { UserService } from '@modules/user';
import { UserLoginMigrationNotActiveLoggableException } from '@modules/user-import/loggable/user-login-migration-not-active.loggable-exception';
import { UserLoginMigrationService, UserMigrationService } from '@modules/user-login-migration';
import { User } from '@modules/user/repo';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { IFindOptions, Permission } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { isError } from 'lodash';
import { UserAlreadyAssignedToImportUserError } from '../domain/error';
import { ImportUserFilter, ImportUserMatchCreatorScope, ImportUserNameMatchFilter } from '../domain/interface';
import { ImportUser, MatchCreator } from '../entity';
import {
	MigrationMayBeCompleted,
	MigrationMayNotBeCompleted,
	SchoolIdDoesNotMatchWithUserSchoolId,
	SchoolInUserMigrationEndLoggable,
	SchoolInUserMigrationStartLoggable,
	SchoolNotMigratedLoggableException,
	UserAlreadyMigratedLoggable,
	UserMigrationFailedLoggable,
} from '../loggable';
import { ImportUserRepo } from '../repo';
import { UserImportService } from '../service';
import { UserImportConfig } from '../user-import-config';
import {
	LdapAlreadyPersistedException,
	MigrationAlreadyActivatedException,
	MissingSchoolNumberException,
} from './ldap-user-migration.error';

export type UserImportPermissions =
	| Permission.IMPORT_USER_MIGRATE
	| Permission.IMPORT_USER_UPDATE
	| Permission.IMPORT_USER_VIEW;

@Injectable()
export class UserImportUc {
	constructor(
		private readonly configService: ConfigService<UserImportConfig, true>,
		private readonly accountService: AccountService,
		private readonly importUserRepo: ImportUserRepo,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService,
		private readonly systemService: SystemService,
		private readonly userService: UserService,
		private readonly logger: Logger,
		private readonly userImportService: UserImportService,
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly userMigrationService: UserMigrationService
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
		query: ImportUserFilter,
		options?: IFindOptions<ImportUser>
	): Promise<Counted<ImportUser[]>> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.IMPORT_USER_VIEW);
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
		const currentUser = await this.getCurrentUser(currentUserId, Permission.IMPORT_USER_UPDATE);
		const school = await this.schoolService.getSchoolById(currentUser.school.id);

		this.userImportService.checkFeatureEnabled(school);

		const importUser = await this.importUserRepo.findById(importUserId);
		const userMatch = await this.userService.getUserEntityWithRoles(userMatchId);

		// check same school
		if (!school.id || school.id !== userMatch.school.id || school.id !== importUser.school.id) {
			this.logger.warning(
				new SchoolIdDoesNotMatchWithUserSchoolId(userMatch.school.id, importUser.school.id, school.id)
			);
			throw new ForbiddenException('not same school');
		}

		// check user is not already assigned
		const hasMatch = await this.importUserRepo.hasMatch(userMatch);
		if (hasMatch !== null) {
			throw new UserAlreadyAssignedToImportUserError();
		}

		importUser.setMatch(userMatch, MatchCreator.MANUAL);
		await this.importUserRepo.save(importUser);

		return importUser;
	}

	public async removeMatch(currentUserId: EntityId, importUserId: EntityId): Promise<ImportUser> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.IMPORT_USER_UPDATE);
		const school = await this.schoolService.getSchoolById(currentUser.school.id);

		this.userImportService.checkFeatureEnabled(school);

		const importUser = await this.importUserRepo.findById(importUserId);

		this.checkImportUserSameSchool(school, importUser);

		importUser.revokeMatch();
		await this.importUserRepo.save(importUser);

		return importUser;
	}

	public async updateFlag(currentUserId: EntityId, importUserId: EntityId, flagged: boolean): Promise<ImportUser> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.IMPORT_USER_UPDATE);
		const school = await this.schoolService.getSchoolById(currentUser.school.id);

		this.userImportService.checkFeatureEnabled(school);

		const importUser = await this.importUserRepo.findById(importUserId);

		this.checkImportUserSameSchool(school, importUser);

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
		query: ImportUserNameMatchFilter,
		options?: IFindOptions<User>
	): Promise<Counted<User[]>> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.IMPORT_USER_VIEW);
		const school = await this.schoolService.getSchoolById(currentUser.school.id);

		this.userImportService.checkFeatureEnabled(school);

		const unmatchedCountedUsers = await this.userService.findForImportUser(currentUser.school, query, options);

		return unmatchedCountedUsers;
	}

	public async saveAllUsersMatches(currentUserId: EntityId): Promise<void> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.IMPORT_USER_MIGRATE);
		const school = await this.schoolService.getSchoolById(currentUser.school.id);

		this.userImportService.checkFeatureEnabled(school);

		const filters = {
			matches: [ImportUserMatchCreatorScope.MANUAL, ImportUserMatchCreatorScope.AUTO],
		};
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
				try {
					// TODO: Find a better solution for this loop
					// this needs to be synchronous, because otherwise it was leading to
					// server crush when working with larger number of users (e.g. 1000)
					// eslint-disable-next-line no-await-in-loop
					await this.updateUserAndAccount(importUser, school);
					migratedUser += 1;
				} catch (error: unknown) {
					if (isError(error)) {
						this.logger.warning(new UserMigrationFailedLoggable(importUser, error));
					}
				}
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

		await this.endSchoolInUserMigration(school);
	}

	private async endSchoolInUserMigration(school: LegacySchoolDo): Promise<void> {
		if (!school.externalId || school.inUserMigration !== true || !school.inMaintenanceSince) {
			this.logger.warning(new MigrationMayBeCompleted(school.inUserMigration));
			throw new BadRequestException('School cannot exit from user migration mode');
		}

		school.inUserMigration = false;

		await this.schoolService.save(school);
	}

	public async startSchoolInUserMigration(currentUserId: EntityId, useCentralLdap = true): Promise<void> {
		const FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION = this.configService.get<boolean>(
			'FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION'
		);

		if (FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION) {
			useCentralLdap = false;
		}

		const currentUser = await this.getCurrentUser(currentUserId, Permission.IMPORT_USER_MIGRATE);
		const school = await this.schoolService.getSchoolById(currentUser.school.id);

		this.userImportService.checkFeatureEnabled(school);
		if (useCentralLdap || FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION) {
			this.checkSchoolNumber(school);
		}
		this.checkSchoolNotInMigration(school);
		if (FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION) {
			await this.checkSchoolMigrated(currentUser.school.id, school);
			await this.checkMigrationActive(currentUser.school.id);
		} else {
			await this.checkNoExistingLdapBeforeStart(school);
		}

		this.logger.notice(new SchoolInUserMigrationStartLoggable(currentUserId, school.name, useCentralLdap));

		if (!FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION) {
			school.externalId = school.officialSchoolNumber;
		}

		school.inUserMigration = true;
		school.inMaintenanceSince = new Date();

		if (useCentralLdap) {
			const migrationSystem = await this.userImportService.getMigrationSystem();

			if (school.systems && !school.systems.includes(migrationSystem.id)) {
				school.systems.push(migrationSystem.id);
			}
		}

		await this.schoolService.save(school);
	}

	private async checkSchoolMigrated(schoolId: EntityId, school: LegacySchoolDo): Promise<void> {
		const userLoginMigration = await this.userLoginMigrationService.findMigrationBySchool(schoolId);

		if (!userLoginMigration) {
			throw new NotFoundLoggableException('UserLoginMigration', { schoolId });
		}

		if (!school.systems?.includes(userLoginMigration.targetSystemId)) {
			throw new SchoolNotMigratedLoggableException(schoolId);
		}
	}

	private async checkMigrationActive(schoolId: EntityId): Promise<void> {
		const userLoginMigration = await this.userLoginMigrationService.findMigrationBySchool(schoolId);

		if (!userLoginMigration || userLoginMigration?.closedAt) {
			throw new UserLoginMigrationNotActiveLoggableException(schoolId);
		}
	}

	public async endSchoolInMaintenance(currentUserId: EntityId): Promise<void> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.IMPORT_USER_MIGRATE);
		const school = await this.schoolService.getSchoolById(currentUser.school.id);

		this.userImportService.checkFeatureEnabled(school);

		if (school.inUserMigration !== false || !school.inMaintenanceSince || !school.externalId) {
			this.logger.warning(new MigrationMayNotBeCompleted(school.inUserMigration));
			throw new BadRequestException('Sync cannot be activated for school');
		}

		school.inMaintenanceSince = undefined;

		const isMigrationRestartable: boolean = this.configService.get(
			'FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION'
		);
		if (isMigrationRestartable) {
			school.inUserMigration = undefined;
		}

		await this.schoolService.save(school);

		this.logger.notice(new SchoolInUserMigrationEndLoggable(school.name));
	}

	public async cancelMigration(currentUserId: EntityId): Promise<void> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.IMPORT_USER_MIGRATE);
		const school = await this.schoolService.getSchoolById(currentUser.school.id);

		this.userImportService.checkFeatureEnabled(school);

		await this.userImportService.resetMigrationForUsersSchool(currentUser, school);
	}

	public async clearAllAutoMatches(currentUserId: EntityId): Promise<void> {
		const currentUser = await this.getCurrentUser(currentUserId, Permission.IMPORT_USER_UPDATE);

		const school = await this.schoolService.getSchoolById(currentUser.school.id);
		this.userImportService.checkFeatureEnabled(school);

		const filters = { matches: [ImportUserMatchCreatorScope.AUTO] };
		const [autoMatchedUsers] = await this.importUserRepo.findImportUsers(currentUser.school, filters);

		for (const autoMatchedUser of autoMatchedUsers) {
			autoMatchedUser.revokeMatch();
		}

		await this.userImportService.saveImportUsers(autoMatchedUsers);
	}

	private async getCurrentUser(currentUserId: EntityId, permission: UserImportPermissions): Promise<User> {
		const currentUser = await this.userService.getUserEntityWithRoles(currentUserId);
		this.authorizationService.checkAllPermissions(currentUser, [permission]);

		return currentUser;
	}

	private async updateUserAndAccount(importUser: ImportUser, school: LegacySchoolDo): Promise<void> {
		const FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION = this.configService.get<boolean>(
			'FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION'
		);

		if (FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION) {
			await this.updateUserAndAccountWithUserLoginMigration(importUser);
		} else {
			await this.updateUserAndAccountWithLdap(importUser, school);
		}
	}

	private async updateUserAndAccountWithLdap(importUser: ImportUser, school: LegacySchoolDo): Promise<void> {
		if (!importUser.user || !importUser.loginName || !school.externalId) {
			return;
		}

		const { user } = importUser;
		user.ldapDn = importUser.ldapDn;
		user.externalId = importUser.externalId;

		const account = await this.getAccount(user);

		account.systemId = importUser.system.id;
		account.password = undefined;
		account.username = `${school.externalId}/${importUser.loginName}`.toLowerCase();

		await this.userService.saveEntity(user);
		await this.accountService.save(account);
		await this.importUserRepo.delete(importUser);
	}

	private async updateUserAndAccountWithUserLoginMigration(importUser: ImportUser): Promise<void> {
		if (!importUser.user) {
			return;
		}

		const user = await this.userService.findByExternalId(importUser.externalId, importUser.system.id);

		if (!user) {
			await this.userMigrationService.migrateUser(importUser.user.id, importUser.externalId, importUser.system.id);
		} else {
			this.logger.notice(new UserAlreadyMigratedLoggable(importUser.user.id));
		}
	}

	private async getAccount(user: User): Promise<Account> {
		let account = await this.accountService.findByUserId(user.id);

		if (!account) {
			const newAccount = {
				userId: user.id,
				username: user.email,
			} as AccountSave;

			await this.accountService.save(newAccount);

			account = await this.accountService.findByUserIdOrFail(user.id);
		}

		return account;
	}

	private async checkNoExistingLdapBeforeStart(school: LegacySchoolDo): Promise<void> {
		if (school.systems && school.systems?.length > 0) {
			for (const systemId of school.systems) {
				// very unusual to have more than 1 system
				// eslint-disable-next-line no-await-in-loop
				const system = await this.systemService.findById(systemId);

				if (system?.ldapConfig) {
					throw new LdapAlreadyPersistedException();
				}
			}
		}
	}

	private checkSchoolNumber(school: LegacySchoolDo): void {
		if (!school.officialSchoolNumber) {
			throw new MissingSchoolNumberException();
		}
	}

	private checkSchoolNotInMigration(school: LegacySchoolDo): void {
		if (school.inUserMigration !== undefined && school.inUserMigration !== null) {
			throw new MigrationAlreadyActivatedException();
		}
	}

	private checkImportUserSameSchool(school: LegacySchoolDo, importUser: ImportUser): void {
		if (school.id !== importUser.school.id) {
			this.logger.warning(new SchoolIdDoesNotMatchWithUserSchoolId('', importUser.school.id, school.id));
			throw new ForbiddenException('not same school');
		}
	}
}
