import { Configuration } from '@hpi-schul-cloud/commons/lib';

export const UserImportFeatures = Symbol('UserImportFeatures');

export interface IUserImportFeatures {
	userMigrationEnabled: boolean;
	userMigrationSystemId: string;
	userMigrationOauthFetching: {
		tokenEndpoint?: string;
		fetchEndpoint?: string;
		clientId?: string;
		clientSecret?: string;
	};
}

export class UserImportConfiguration {
	static userImportFeatures: IUserImportFeatures = {
		userMigrationEnabled: Configuration.get('FEATURE_USER_MIGRATION_ENABLED') as boolean,
		userMigrationSystemId: Configuration.get('FEATURE_USER_MIGRATION_SYSTEM_ID') as string,
		userMigrationOauthFetching: {
			tokenEndpoint: this.getFeatureOrUndefined('FEATURE_USER_MIGRATION_OAUTH_FETCHING__TOKEN_ENDPOINT'),
			fetchEndpoint: this.getFeatureOrUndefined('FEATURE_USER_MIGRATION_OAUTH_FETCHING__FETCH_ENDPOINT'),
			clientId: this.getFeatureOrUndefined('FEATURE_USER_MIGRATION_OAUTH_FETCHING__CLIENT_ID'),
			clientSecret: this.getFeatureOrUndefined('FEATURE_USER_MIGRATION_OAUTH_FETCHING__CLIENT_SECRET'),
		},
	};

	private static getFeatureOrUndefined<T>(feature: string): T | undefined {
		return Configuration.has(feature) ? (Configuration.get(feature) as T) : undefined;
	}
}
