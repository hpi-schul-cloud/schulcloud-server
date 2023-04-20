import { BusinessError } from '@shared/common';
import { HttpStatus } from '@nestjs/common';
import { OAuthMigrationError } from './oauth-migration.error';

export class SchoolMigrationError extends BusinessError {
	constructor(details?: Record<string, unknown>) {
		if (details && details.oauthMigrationError && details.oauthMigrationError instanceof OAuthMigrationError) {
			if (details.oauthMigrationError.errorcode === 'ext_official_school_number_mismatch') {
				super(
					{
						type: details.oauthMigrationError.errorcode,
						title: 'Migration of school failed.',
						defaultMessage: details.oauthMigrationError.message,
					},
					HttpStatus.INTERNAL_SERVER_ERROR,
					{
						officialSchoolNumberFromTarget: details.oauthMigrationError.officialSchoolNumberFromTarget,
						officialSchoolNumberFromSource: details.oauthMigrationError.officialSchoolNumberFromSource,
					}
				);
			} else {
				super(
					{
						type: details.oauthMigrationError.errorcode || details.oauthMigrationError.DEFAULT_ERRORCODE,
						title: 'Migration of school failed',
						defaultMessage: details.oauthMigrationError.message || details.oauthMigrationError.DEFAULT_MESSAGE,
					},
					HttpStatus.INTERNAL_SERVER_ERROR
				);
			}
		}
	}
}
