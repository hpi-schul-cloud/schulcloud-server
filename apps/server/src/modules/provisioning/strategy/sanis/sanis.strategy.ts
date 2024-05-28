import {
	SchulconnexLizenzInfoResponse,
	SchulconnexResponse,
	SchulconnexResponseValidationGroups,
} from '@infra/schulconnex-client/response';
import { SchulconnexRestClient } from '@infra/schulconnex-client/schulconnex-rest-client';
import { GroupService } from '@modules/group/service/group.service';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationErrorLoggableException } from '@shared/common/loggable-exception';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { IProvisioningFeatures, ProvisioningFeatures } from '../../config';
import {
	ExternalGroupDto,
	ExternalLicenseDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
} from '../../dto';
import { ProvisioningConfig } from '../../provisioning.config';
import { SchulconnexProvisioningStrategy } from '../oidc';
import {
	SchulconnexCourseSyncService,
	SchulconnexGroupProvisioningService,
	SchulconnexLicenseProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexToolProvisioningService,
	SchulconnexUserProvisioningService,
} from '../oidc/service';
import { SchulconnexResponseMapper } from './schulconnex-response-mapper';

@Injectable()
export class SanisProvisioningStrategy extends SchulconnexProvisioningStrategy {
	constructor(
		@Inject(ProvisioningFeatures) protected readonly provisioningFeatures: IProvisioningFeatures,
		protected readonly schulconnexSchoolProvisioningService: SchulconnexSchoolProvisioningService,
		protected readonly schulconnexUserProvisioningService: SchulconnexUserProvisioningService,
		protected readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		protected readonly schulconnexCourseSyncService: SchulconnexCourseSyncService,
		protected readonly groupService: GroupService,
		protected readonly schulconnexLicenseProvisioningService: SchulconnexLicenseProvisioningService,
		protected readonly schulconnexToolProvisioningService: SchulconnexToolProvisioningService,
		private readonly responseMapper: SchulconnexResponseMapper,
		private readonly schulconnexRestClient: SchulconnexRestClient,
		protected readonly configService: ConfigService<ProvisioningConfig, true>
	) {
		super(
			provisioningFeatures,
			schulconnexSchoolProvisioningService,
			schulconnexUserProvisioningService,
			schulconnexGroupProvisioningService,
			schulconnexCourseSyncService,
			schulconnexLicenseProvisioningService,
			schulconnexToolProvisioningService,
			groupService,
			configService
		);
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.SANIS;
	}

	override async getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		if (!input.system.provisioningUrl) {
			throw new InternalServerErrorException(
				`Sanis system with id: ${input.system.systemId} is missing a provisioning url`
			);
		}

		const schulconnexAxiosResponse: SchulconnexResponse = await this.schulconnexRestClient.getPersonInfo(
			input.accessToken,
			{
				overrideUrl: input.system.provisioningUrl,
			}
		);

		const schulconnexResponse: SchulconnexResponse = plainToClass(SchulconnexResponse, schulconnexAxiosResponse);

		await this.checkResponseValidation(schulconnexResponse, [
			SchulconnexResponseValidationGroups.USER,
			SchulconnexResponseValidationGroups.SCHOOL,
		]);

		const externalUser: ExternalUserDto = this.responseMapper.mapToExternalUserDto(schulconnexResponse);
		this.addTeacherRoleIfAdmin(externalUser);

		const externalSchool: ExternalSchoolDto = this.responseMapper.mapToExternalSchoolDto(schulconnexResponse);

		let externalGroups: ExternalGroupDto[] | undefined;
		if (this.provisioningFeatures.schulconnexGroupProvisioningEnabled) {
			await this.checkResponseValidation(schulconnexResponse, [SchulconnexResponseValidationGroups.GROUPS]);

			externalGroups = this.responseMapper.mapToExternalGroupDtos(schulconnexResponse);
		}

		let externalLicenses: ExternalLicenseDto[] | undefined;
		if (this.configService.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')) {
			const schulconnexLizenzInfoAxiosResponse: SchulconnexLizenzInfoResponse[] =
				await this.schulconnexRestClient.getLizenzInfo(input.accessToken, {
					overrideUrl: this.configService.get('PROVISIONING_SCHULCONNEX_LIZENZ_INFO_URL'),
				});

			const schulconnexLizenzInfoResponses: SchulconnexLizenzInfoResponse[] = plainToClass(
				SchulconnexLizenzInfoResponse,
				schulconnexLizenzInfoAxiosResponse
			);
			await this.checkResponseValidation(schulconnexLizenzInfoResponses);

			externalLicenses = SchulconnexResponseMapper.mapToExternalLicenses(schulconnexLizenzInfoResponses);
		}

		const oauthData: OauthDataDto = new OauthDataDto({
			system: input.system,
			externalSchool,
			externalUser,
			externalGroups,
			externalLicenses,
		});

		return oauthData;
	}

	private async checkResponseValidation(
		response: SchulconnexResponse | SchulconnexLizenzInfoResponse | SchulconnexLizenzInfoResponse[],
		groups?: SchulconnexResponseValidationGroups[]
	): Promise<void> {
		const responsesArray = Array.isArray(response) ? response : [response];

		const validationPromises: Promise<ValidationError[]>[] = responsesArray.map((item) =>
			validate(item, {
				always: true,
				forbidUnknownValues: false,
				groups,
			})
		);

		const validationResults: ValidationError[][] = await Promise.all(validationPromises);

		const validationErrors: ValidationError[] = validationResults.flat();

		if (validationErrors.length) {
			throw new ValidationErrorLoggableException(validationErrors);
		}
	}

	private addTeacherRoleIfAdmin(externalUser: ExternalUserDto): void {
		if (externalUser.roles && externalUser.roles.includes(RoleName.ADMINISTRATOR)) {
			externalUser.roles.push(RoleName.TEACHER);
		}
	}
}
