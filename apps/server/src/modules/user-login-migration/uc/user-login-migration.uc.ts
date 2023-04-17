import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId, IFindOptions, UserLoginMigrationDO } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { OAuthTokenDto } from '@src/modules/oauth';
import { OauthDataDto } from '@src/modules/provisioning/dto';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { ProvisioningService } from '@src/modules/provisioning';
import { AuthenticationService } from '@src/modules/authentication/services/authentication.service';
import { Logger } from '@src/core/logger';
import { PageTypes } from '../interface/page-types.enum';
import { SchoolMigrationService, UserLoginMigrationService, UserMigrationService } from '../service';
import { PageContentDto } from '../service/dto/page-content.dto';
import { UserLoginMigrationQuery } from './dto/user-login-migration-query';
import { MigrationDto } from '../service/dto/migration.dto';

@Injectable()
export class UserLoginMigrationUc {
	constructor(
		private readonly userMigrationService: UserMigrationService,
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly oauthService: OAuthService,
		private readonly provisioningService: ProvisioningService,
		private readonly authenticationService: AuthenticationService,
		private readonly logger: Logger
	) {}

	async getPageContent(pageType: PageTypes, sourceSystem: string, targetSystem: string): Promise<PageContentDto> {
		const content: PageContentDto = await this.userMigrationService.getPageContent(
			pageType,
			sourceSystem,
			targetSystem
		);

		return content;
	}

	async getMigrations(
		userId: EntityId,
		query: UserLoginMigrationQuery,
		options: IFindOptions<UserLoginMigrationDO>
	): Promise<Page<UserLoginMigrationDO>> {
		if (userId !== query.userId) {
			throw new ForbiddenException('Accessing migration status of another user is forbidden.');
		}

		const userLoginMigrations: Page<UserLoginMigrationDO> =
			await this.userLoginMigrationService.findUserLoginMigrations(query, options);

		return userLoginMigrations;
	}

	async migrateUser(
		jwt: string,
		userId: EntityId,
		targetSystemId: EntityId,
		redirectUri: string,
		code?: string
	): Promise<void> {
		this.logMigrationInformation(userId, `Migrates to targetSystem with id ${targetSystemId}`);

		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(targetSystemId, redirectUri, code);

		const data: OauthDataDto = await this.provisioningService.getData(
			targetSystemId,
			tokenDto.idToken,
			tokenDto.accessToken
		);

		this.logMigrationInformation(userId, undefined, data, targetSystemId);

		if (data.externalSchool) {
			const schoolToMigrate: SchoolDO | null = await this.schoolMigrationService.schoolToMigrate(
				userId,
				data.externalSchool.externalId,
				data.externalSchool.officialSchoolNumber
			);

			this.logMigrationInformation(
				userId,
				`Found school with officialSchoolNumber (${data.externalSchool.officialSchoolNumber ?? ''})`
			);

			if (schoolToMigrate) {
				await this.schoolMigrationService.migrateSchool(
					data.externalSchool.externalId,
					schoolToMigrate,
					targetSystemId
				);

				this.logMigrationInformation(userId, undefined, data, data.system.systemId, schoolToMigrate);
			}
		}

		const migrationDto: MigrationDto = await this.userMigrationService.migrateUser(
			userId,
			data.externalUser.externalId,
			targetSystemId
		);

		// TODO: N21-632 - Remove client redirects
		if (migrationDto.redirect.includes('/migration/error')) {
			throw new InternalServerErrorException('Error during migration of user');
		}

		this.logMigrationInformation(userId, `Successfully migrated user and redirects to ${migrationDto.redirect}`);

		await this.authenticationService.removeJwtFromWhitelist(jwt);
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
