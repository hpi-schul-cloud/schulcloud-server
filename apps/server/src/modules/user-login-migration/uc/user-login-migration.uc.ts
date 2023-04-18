import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { EntityId } from '@shared/domain';
// import { AuthenticationService } from '@src/modules/authentication/services/authentication.service';
import { OAuthTokenDto } from '@src/modules/oauth';
import { OauthDataDto } from '@src/modules/provisioning/dto';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { ProvisioningService } from '@src/modules/provisioning';
import { AuthenticationService } from '@src/modules/authentication/services/authentication.service';
import { MigrationDto } from '../service/dto/migration.dto';
import { SchoolMigrationService, UserMigrationService } from '../service';

@Injectable()
export class UserLoginMigrationUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly provisioningService: ProvisioningService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly userMigrationService: UserMigrationService,
		private readonly authenticationService: AuthenticationService
	) {}

	async migrate(
		userJwt: string,
		currentUserId: string,
		systemId: EntityId,
		code: string,
		redirectUri: string
	): Promise<void> {
		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(systemId, redirectUri, code);

		const data: OauthDataDto = await this.provisioningService.getData(systemId, tokenDto.idToken, tokenDto.accessToken);

		if (data.externalSchool) {
			const schoolToMigrate: SchoolDO | null = await this.schoolMigrationService.schoolToMigrate(
				currentUserId,
				data.externalSchool.externalId,
				data.externalSchool.officialSchoolNumber
			);
			if (schoolToMigrate) {
				await this.schoolMigrationService.migrateSchool(data.externalSchool.externalId, schoolToMigrate, systemId);
			}
		}

		const migrationDto: MigrationDto = await this.userMigrationService.migrateUser(
			currentUserId,
			data.externalUser.externalId,
			systemId
		);

		// TODO: N21-820 when the userMigrationService.migrateUser will not longer be used throw errors directly
		if (migrationDto.redirect.includes('migration/error')) {
			throw new InternalServerErrorException();
		}

		await this.authenticationService.removeJwtFromWhitelist(userJwt);
	}
}
