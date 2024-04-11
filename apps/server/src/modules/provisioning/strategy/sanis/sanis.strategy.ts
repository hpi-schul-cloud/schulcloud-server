import { SanisGruppenResponse, SanisResponse, SanisResponseValidationGroups } from '@infra/schulconnex-client/response';
import { GroupService } from '@modules/group';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ValidationErrorLoggableException } from '@shared/common/loggable-exception';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { firstValueFrom } from 'rxjs';
import { IProvisioningFeatures, ProvisioningFeatures } from '../../config';
import {
	ExternalGroupDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
} from '../../dto';
import { SchulconnexProvisioningStrategy } from '../oidc';
import {
	SchulconnexCourseSyncService,
	SchulconnexGroupProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexUserProvisioningService,
} from '../oidc/service';
import { SanisResponseMapper } from './sanis-response.mapper';

@Injectable()
export class SanisProvisioningStrategy extends SchulconnexProvisioningStrategy {
	constructor(
		@Inject(ProvisioningFeatures) protected readonly provisioningFeatures: IProvisioningFeatures,
		protected readonly schulconnexSchoolProvisioningService: SchulconnexSchoolProvisioningService,
		protected readonly schulconnexUserProvisioningService: SchulconnexUserProvisioningService,
		protected readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		protected readonly schulconnexCourseSyncService: SchulconnexCourseSyncService,
		protected readonly groupService: GroupService,
		private readonly responseMapper: SanisResponseMapper,
		private readonly httpService: HttpService
	) {
		super(
			provisioningFeatures,
			schulconnexSchoolProvisioningService,
			schulconnexUserProvisioningService,
			schulconnexGroupProvisioningService,
			schulconnexCourseSyncService,
			groupService
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

		// TODO: N21-1678 use the schulconnex rest client
		const axiosConfig: AxiosRequestConfig = {
			headers: {
				Authorization: `Bearer ${input.accessToken}`,
				'Accept-Encoding': 'gzip',
			},
		};

		const axiosResponse: AxiosResponse<SanisResponse> = await firstValueFrom(
			this.httpService.get(input.system.provisioningUrl, axiosConfig)
		);

		const fixedData: SanisResponse = this.removeEmptyObjectsFromResponse(axiosResponse.data);

		const response: SanisResponse = plainToClass(SanisResponse, fixedData);

		await this.checkResponseValidation(response, [
			SanisResponseValidationGroups.USER,
			SanisResponseValidationGroups.SCHOOL,
		]);

		const externalUser: ExternalUserDto = this.responseMapper.mapToExternalUserDto(axiosResponse.data);
		this.addTeacherRoleIfAdmin(externalUser);

		const externalSchool: ExternalSchoolDto = this.responseMapper.mapToExternalSchoolDto(axiosResponse.data);

		let externalGroups: ExternalGroupDto[] | undefined;
		if (this.provisioningFeatures.schulconnexGroupProvisioningEnabled) {
			await this.checkResponseValidation(response, [SanisResponseValidationGroups.GROUPS]);

			externalGroups = this.responseMapper.mapToExternalGroupDtos(axiosResponse.data);
		}

		const oauthData: OauthDataDto = new OauthDataDto({
			system: input.system,
			externalSchool,
			externalUser,
			externalGroups,
		});

		return oauthData;
	}

	// This is a temporary fix to a problem with moin.schule and should be resolved after 12.12.23
	private removeEmptyObjectsFromResponse(response: SanisResponse): SanisResponse {
		const fixedResponse: SanisResponse = { ...response };

		if (fixedResponse?.personenkontexte?.length && fixedResponse.personenkontexte[0].gruppen) {
			const groups: SanisGruppenResponse[] = fixedResponse.personenkontexte[0].gruppen;

			for (const group of groups) {
				group.sonstige_gruppenzugehoerige = group.sonstige_gruppenzugehoerige?.filter(
					(relation) => !this.isObjectEmpty(relation)
				);

				if (!group.sonstige_gruppenzugehoerige?.length) {
					group.sonstige_gruppenzugehoerige = undefined;
				}
			}

			fixedResponse.personenkontexte[0].gruppen = groups.filter((group) => !this.isObjectEmpty(group));

			if (!fixedResponse.personenkontexte[0].gruppen.length) {
				fixedResponse.personenkontexte[0].gruppen = undefined;
			}
		}

		return fixedResponse;
	}

	private isObjectEmpty(obj: unknown): boolean {
		return typeof obj === 'object' && !!obj && !Object.keys(obj).some((key) => obj[key] !== undefined);
	}

	private async checkResponseValidation(response: SanisResponse, groups: SanisResponseValidationGroups[]) {
		const validationErrors: ValidationError[] = await validate(response, {
			always: true,
			forbidUnknownValues: false,
			groups,
		});

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
