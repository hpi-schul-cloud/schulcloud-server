import { Configuration } from '@hpi-schul-cloud/commons/lib';

export const UserImportFeatures = Symbol('UserImportFeatures');

export interface IUserImportFeatures {
	userMigrationEnabled: boolean;
	userMigrationSystemId: string;
	userMigrationFetching: {
		endpoint: string;
		clientId: string;
		clientSecret: string;
	};
}

export class UserImportConfiguration {
	static userImportFeatures: IUserImportFeatures = {
		userMigrationEnabled: Configuration.get('FEATURE_USER_MIGRATION_ENABLED') as boolean,
		userMigrationSystemId: Configuration.get('FEATURE_USER_MIGRATION_SYSTEM_ID') as string,
		userMigrationFetching: {
			endpoint: Configuration.get('FEATURE_USER_MIGRATION_FETCHING__ENDPOINT') as string,
			clientId: Configuration.get('FEATURE_USER_MIGRATION_FETCHING__CLIENT_ID') as string,
			clientSecret: Configuration.get('FEATURE_USER_MIGRATION_FETCHING__CLIENT_SECRET') as string,
		},
	};
}
