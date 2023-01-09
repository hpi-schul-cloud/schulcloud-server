import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SanisResponseMapper } from '@src/modules/provisioning/strategy/sanis/sanis-response.mapper';
import { SanisResponse } from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ExternalSchoolDto, ExternalUserDto, OauthDataDto, OauthDataStrategyInputDto } from '../../dto';
import { OidcProvisioningStrategy } from '../oidc/oidc.strategy';
import { OidcProvisioningService } from '../oidc/service/oidc-provisioning.service';

@Injectable()
export class SanisProvisioningStrategy extends OidcProvisioningStrategy {
	constructor(
		private readonly responseMapper: SanisResponseMapper,
		private readonly httpService: HttpService,
		protected readonly oidcProvisioningService: OidcProvisioningService
	) {
		super(oidcProvisioningService);
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

		const axiosConfig: AxiosRequestConfig = {
			headers: { Authorization: `Bearer ${input.accessToken}` },
		};

		const axiosResponse: AxiosResponse<SanisResponse> = await firstValueFrom(
			this.httpService.get(input.system.provisioningUrl, axiosConfig)
		);

		const externalUser: ExternalUserDto = this.responseMapper.mapToExternalUserDto(axiosResponse.data);
		const externalSchool: ExternalSchoolDto = this.responseMapper.mapToExternalSchoolDto(axiosResponse.data);

		const oauthData: OauthDataDto = new OauthDataDto({
			system: input.system,
			externalSchool,
			externalUser,
		});
		return oauthData;
	}
}
