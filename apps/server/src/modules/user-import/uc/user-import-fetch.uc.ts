import { AuthorizationService } from '@modules/authorization';
import { System, SystemService } from '@modules/system';
import { UserLoginMigrationService } from '@modules/user-login-migration';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserLoginMigrationDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ImportUser } from '../entity';
import { UserLoginMigrationNotActiveLoggableException, UserMigrationIsNotEnabledLoggableException } from '../loggable';
import { SchulconnexFetchImportUsersService, UserImportService } from '../service';
import { UserImportConfig } from '../user-import-config';

@Injectable()
export class UserImportFetchUc {
	constructor(
		private readonly configService: ConfigService<UserImportConfig, true>,
		private readonly schulconnexFetchImportUsersService: SchulconnexFetchImportUsersService,
		private readonly authorizationService: AuthorizationService,
		private readonly userImportService: UserImportService,
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly systemService: SystemService
	) {}

	public async populateImportUsers(currentUserId: EntityId): Promise<void> {
		if (!this.configService.get('FEATURE_USER_MIGRATION_ENABLED')) {
			throw new UserMigrationIsNotEnabledLoggableException(currentUserId);
		}

		const user: User = await this.authorizationService.getUserWithPermissions(currentUserId);
		this.authorizationService.checkAllPermissions(user, [Permission.IMPORT_USER_MIGRATE]);

		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			user.school.id
		);

		if (!userLoginMigration || userLoginMigration?.closedAt) {
			throw new UserLoginMigrationNotActiveLoggableException(user.school.id);
		}

		const system: System = await this.systemService.findByIdOrFail(userLoginMigration.targetSystemId);
		const fetchedData: ImportUser[] = await this.schulconnexFetchImportUsersService.getData(user.school, system);

		const filteredFetchedData: ImportUser[] = await this.schulconnexFetchImportUsersService.filterAlreadyMigratedUser(
			fetchedData,
			system
		);

		const matchedImportUsers: ImportUser[] = await this.userImportService.matchUsers(
			filteredFetchedData,
			userLoginMigration
		);

		await this.userImportService.deleteImportUsersBySchool(user.school);

		await this.userImportService.saveImportUsers(matchedImportUsers);
	}
}
