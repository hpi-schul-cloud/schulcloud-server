import { Configuration } from '@hpi-schul-cloud/commons/lib';

export const UserImportFeatures = Symbol('UserImportFeatures');

export interface IUserImportFeatures {
	userMigrationEnabled: boolean;
	userMigrationSystemId: string;
	useWithUserLoginMigration: boolean;
}

export class UserImportConfiguration {
	static userImportFeatures: IUserImportFeatures = {
		userMigrationEnabled: Configuration.get('FEATURE_USER_MIGRATION_ENABLED') as boolean,
		userMigrationSystemId: Configuration.get('FEATURE_USER_MIGRATION_SYSTEM_ID') as string,
		useWithUserLoginMigration: Configuration.get('FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION') as boolean,
	};
}
