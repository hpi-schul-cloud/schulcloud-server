import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { EntityId } from '@shared/domain';
import { OAuthTokenDto } from '@src/modules/oauth';
import { OauthDataDto } from '@src/modules/provisioning/dto';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { ProvisioningService } from '@src/modules/provisioning';
import { AuthenticationService } from '@src/modules/authentication/services/authentication.service';
import { Logger } from '@src/core/logger';
import { MigrationDto } from '../service/dto/migration.dto';
import { SchoolMigrationService, UserMigrationService } from '../service';

@Injectable()
export class UserLoginMigrationUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly provisioningService: ProvisioningService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly userMigrationService: UserMigrationService,
		private readonly authenticationService: AuthenticationService,
		private readonly logger: Logger
	) {}

	async migrate(
		userJwt: string,
		currentUserId: string,
		targetSystemId: EntityId,
		code: string,
		redirectUri: string
	): Promise<void> {
		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(targetSystemId, redirectUri, code);

		this.logMigrationInformation(currentUserId, `Migrates to targetSystem with id ${targetSystemId}`);

		const data: OauthDataDto = await this.provisioningService.getData(
			targetSystemId,
			tokenDto.idToken,
			tokenDto.accessToken
		);

		this.logMigrationInformation(currentUserId, undefined, data, targetSystemId);

		if (data.externalSchool) {
			const schoolToMigrate: SchoolDO | null = await this.schoolMigrationService.schoolToMigrate(
				currentUserId,
				data.externalSchool.externalId,
				data.externalSchool.officialSchoolNumber
			);

			this.logMigrationInformation(
				currentUserId,
				`Found school with officialSchoolNumber (${data.externalSchool.officialSchoolNumber ?? ''})`
			);

			if (schoolToMigrate) {
				await this.schoolMigrationService.migrateSchool(
					data.externalSchool.externalId,
					schoolToMigrate,
					targetSystemId
				);

				this.logMigrationInformation(currentUserId, undefined, data, data.system.systemId, schoolToMigrate);
			}
		}

		const migrationDto: MigrationDto = await this.userMigrationService.migrateUser(
			currentUserId,
			data.externalUser.externalId,
			targetSystemId
		);

		// TODO: N21-820 when the userMigrationService.migrateUser will not longer be used throw errors directly
		if (migrationDto.redirect.includes('migration/error')) {
			throw new InternalServerErrorException();
		}

		this.logMigrationInformation(currentUserId, `Successfully migrated user and redirects to ${migrationDto.redirect}`);

		await this.authenticationService.removeJwtFromWhitelist(userJwt);
	}

	private logMigrationInformation(
		userId: string,
		text?: string,
		oauthData?: OauthDataDto,
		targetSystemId?: string,
		school?: SchoolDO
	) {
		let message = `MIGRATION (userId: ${userId}): ${text ?? ''}`;
		if (!school && oauthData) {
			message += `Provisioning data received from targetSystem (${targetSystemId ?? 'N/A'} with data: 
			{ 
				"officialSchoolNumber": ${oauthData.externalSchool?.officialSchoolNumber ?? 'N/A'},
				"externalSchoolId": ${oauthData.externalSchool?.externalId ?? ''}
				"externalUserId": ${oauthData.externalUser.externalId},
			})`;
		}
		if (school && oauthData) {
			message += `Successfully migrated school (${school.name} - (${school.id ?? 'N/A'}) to targetSystem ${
				targetSystemId ?? 'N/A'
			} which has the externalSchoolId ${oauthData.externalSchool?.externalId ?? 'N/A'}`;
		}
		this.logger.debug(message);
	}
}
