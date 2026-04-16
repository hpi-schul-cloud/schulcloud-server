import { Logger } from '@core/logger';
import {
	SchulconnexPoliciesInfoLicenseResponse,
	SchulconnexPoliciesInfoResponse,
	SchulconnexResponse,
	SchulconnexResponseValidationGroups,
	SchulconnexRestClient,
} from '@infra/schulconnex-client';
import { Group, GroupService } from '@modules/group';
import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { UserDo } from '@modules/user';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { NotFoundLoggableException, ValidationErrorLoggableException } from '@shared/common/loggable-exception';
import { Page } from '@shared/domain/domainobject';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { RoleName } from '../../../role';
import { SchulconnexGroupProvisioningProducer, SchulconnexLicenseProvisioningProducer } from '../../amqp';
import {
	ExternalGroupDto,
	ExternalLicenseDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningDto,
} from '../../dto';
import { FetchingPoliciesInfoFailedLoggable, PoliciesInfoErrorResponseLoggable } from '../../loggable';
import { PROVISIONING_CONFIG_TOKEN, ProvisioningConfig } from '../../provisioning.config';
import { ProvisioningStrategy } from '../base.strategy';
import { SchulconnexResponseMapper } from './schulconnex-response-mapper';
import {
	SchulconnexGroupProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexUserProvisioningService,
} from './service';

@Injectable()
export class SchulconnexAsyncProvisioningStrategy extends ProvisioningStrategy {
	constructor(
		private readonly schulconnexSchoolProvisioningService: SchulconnexSchoolProvisioningService,
		private readonly schulconnexUserProvisioningService: SchulconnexUserProvisioningService,
		private readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		private readonly schulconnexGroupProvisioningProducer: SchulconnexGroupProvisioningProducer,
		private readonly schulconnexLicenseProvisioningProducer: SchulconnexLicenseProvisioningProducer,
		private readonly groupService: GroupService,
		protected readonly responseMapper: SchulconnexResponseMapper,
		protected readonly schulconnexRestClient: SchulconnexRestClient,
		@Inject(PROVISIONING_CONFIG_TOKEN)
		protected readonly config: ProvisioningConfig,
		protected readonly logger: Logger
	) {
		super();
	}

	public getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.SCHULCONNEX_ASYNC;
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
		if (this.config.featureSchulconnexGroupProvisioningEnabled) {
			await this.checkResponseValidation(schulconnexResponse, [SchulconnexResponseValidationGroups.GROUPS]);

			externalGroups = this.responseMapper.mapToExternalGroupDtos(schulconnexResponse);
		}

		let externalLicenses: ExternalLicenseDto[] | undefined;
		if (this.config.featureSchulconnexMediaLicenseEnabled) {
			const policiesInfoUrl = this.config.provisioningSchulconnexPoliciesInfoUrl;
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

	public override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
		const { systemId } = data.system;
		let school: LegacySchoolDo | undefined;
		if (data.externalSchool) {
			school = await this.schulconnexSchoolProvisioningService.provisionExternalSchool(data.externalSchool, systemId);
		}

		const user = await this.schulconnexUserProvisioningService.provisionExternalUser(
			data.externalUser,
			systemId,
			school?.id
		);

		if (this.config.featureSchulconnexGroupProvisioningEnabled) {
			await this.provisionGroups(data, user, school);
		}

		if (this.config.featureSchulconnexMediaLicenseEnabled && user.id) {
			await this.schulconnexLicenseProvisioningProducer.provisonLicenses({
				userId: user.id,
				schoolId: user.schoolId,
				systemId,
				externalLicenses: data.externalLicenses ?? [],
			});
		}

		return new ProvisioningDto({ externalUserId: data.externalUser.externalId });
	}

	private async provisionGroups(data: OauthDataDto, user: UserDo, school?: LegacySchoolDo): Promise<void> {
		if (!user?.id) {
			throw new NotFoundLoggableException(UserDo.name, { externalId: data.externalUser.externalId });
		}
		const userId = user.id;
		const { systemId } = data.system;

		let externalGroups: ExternalGroupDto[] = [];
		if (data.externalGroups) {
			externalGroups = await this.schulconnexGroupProvisioningService.filterExternalGroups(
				data.externalGroups,
				school?.id,
				data.system.systemId
			);
		}

		const existingGroupsOfUser: Page<Group> = await this.groupService.findGroups({ userId, systemId });

		const groupsWithoutUser = existingGroupsOfUser.data.filter((existingGroupFromSystem: Group) => {
			const isUserInGroup = externalGroups.some(
				(externalGroup: ExternalGroupDto) =>
					externalGroup.externalId === existingGroupFromSystem.externalSource?.externalId
			);

			return !isUserInGroup;
		});

		const removalPromises = groupsWithoutUser.map(async (group: Group): Promise<void> => {
			await this.schulconnexGroupProvisioningProducer.removeUserFromGroup({
				userId,
				groupId: group.id,
			});
		});
		const provisioningPromises = externalGroups.map(async (externalGroup: ExternalGroupDto): Promise<void> => {
			await this.schulconnexGroupProvisioningProducer.provisonGroup({
				systemId,
				externalGroup,
				externalSchool: data.externalSchool,
			});
		});

		await Promise.all(removalPromises);
		await Promise.all(provisioningPromises);
	}
}
