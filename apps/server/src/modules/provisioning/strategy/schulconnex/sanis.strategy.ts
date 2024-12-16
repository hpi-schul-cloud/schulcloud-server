import {
	SchulconnexPoliciesInfoLicenseResponse,
	SchulconnexPoliciesInfoResponse,
	SchulconnexResponse,
	SchulconnexResponseValidationGroups,
	SchulconnexRestClient,
} from '@infra/schulconnex-client';
import { GroupService } from '@modules/group/service/group.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationErrorLoggableException } from '@shared/common/loggable-exception';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { Logger } from '@src/core/logger';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import {
	ExternalGroupDto,
	ExternalLicenseDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
} from '../../dto';
import { FetchingPoliciesInfoFailedLoggable, PoliciesInfoErrorResponseLoggable } from '../../loggable';
import { ProvisioningConfig } from '../../provisioning.config';
import { SchulconnexResponseMapper } from './schulconnex-response-mapper';
import { SchulconnexProvisioningStrategy } from './schulconnex.strategy';
import {
	SchulconnexCourseSyncService,
	SchulconnexGroupProvisioningService,
	SchulconnexLicenseProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexToolProvisioningService,
	SchulconnexUserProvisioningService,
} from './service';

@Injectable()
export class SanisProvisioningStrategy extends SchulconnexProvisioningStrategy {
	constructor(
		protected readonly schulconnexSchoolProvisioningService: SchulconnexSchoolProvisioningService,
		protected readonly schulconnexUserProvisioningService: SchulconnexUserProvisioningService,
		protected readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		protected readonly schulconnexCourseSyncService: SchulconnexCourseSyncService,
		protected readonly groupService: GroupService,
		protected readonly schulconnexLicenseProvisioningService: SchulconnexLicenseProvisioningService,
		protected readonly schulconnexToolProvisioningService: SchulconnexToolProvisioningService,
		protected readonly configService: ConfigService<ProvisioningConfig, true>,
		protected readonly logger: Logger,
		private readonly responseMapper: SchulconnexResponseMapper,
		private readonly schulconnexRestClient: SchulconnexRestClient
	) {
		super(
			schulconnexSchoolProvisioningService,
			schulconnexUserProvisioningService,
			schulconnexGroupProvisioningService,
			schulconnexCourseSyncService,
			schulconnexLicenseProvisioningService,
			schulconnexToolProvisioningService,
			groupService,
			configService,
			logger
		);
	}

	public getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.SANIS;
	}

	public override async getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
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
		if (this.configService.get('FEATURE_SANIS_GROUP_PROVISIONING_ENABLED')) {
			await this.checkResponseValidation(schulconnexResponse, [SchulconnexResponseValidationGroups.GROUPS]);

			externalGroups = this.responseMapper.mapToExternalGroupDtos(schulconnexResponse);
		}

		let externalLicenses: ExternalLicenseDto[] | undefined;
		if (this.configService.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')) {
			const policiesInfoUrl = this.configService.get<string>('PROVISIONING_SCHULCONNEX_POLICIES_INFO_URL');
			try {
				const schulconnexPoliciesInfoAxiosResponse = await this.schulconnexRestClient.getPoliciesInfo(
					input.accessToken,
					{
						overrideUrl: policiesInfoUrl,
					}
				);

				const schulconnexPoliciesInfoResponse = plainToClass(
					SchulconnexPoliciesInfoResponse,
					schulconnexPoliciesInfoAxiosResponse
				);

				await this.checkResponseValidation(schulconnexPoliciesInfoResponse);

				const schulconnexPoliciesInfoLicenceResponses: SchulconnexPoliciesInfoLicenseResponse[] =
					schulconnexPoliciesInfoResponse.data.filter((item): item is SchulconnexPoliciesInfoLicenseResponse => {
						if (item instanceof SchulconnexPoliciesInfoLicenseResponse) {
							return true;
						}

						this.logger.warning(new PoliciesInfoErrorResponseLoggable(item));
						return false;
					});

				externalLicenses = SchulconnexResponseMapper.mapToExternalLicenses(schulconnexPoliciesInfoLicenceResponses);
			} catch (error) {
				this.logger.warning(new FetchingPoliciesInfoFailedLoggable(externalUser, policiesInfoUrl));
			}
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
		response: SchulconnexResponse | SchulconnexPoliciesInfoResponse | SchulconnexPoliciesInfoResponse[],
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
