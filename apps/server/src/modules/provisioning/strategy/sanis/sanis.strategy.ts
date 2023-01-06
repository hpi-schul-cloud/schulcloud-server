import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SanisResponse } from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { SanisResponseMapper } from '@src/modules/provisioning/strategy/sanis/sanis-response.mapper';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SanisSchoolService } from '@src/modules/provisioning/strategy/sanis/service/sanis-school.service';
import { SanisUserService } from '@src/modules/provisioning/strategy/sanis/service/sanis-user.service';
import { SchoolDO } from '@shared/domain/domainobject/school.do';

export type SanisStrategyData = {
	provisioningUrl: string;
	accessToken: string;
	systemId: string;
};

@Injectable()
export class SanisProvisioningStrategy extends ProvisioningStrategy<SanisStrategyData> {
	constructor(
		private readonly responseMapper: SanisResponseMapper,
		private readonly httpService: HttpService,
		private readonly sanisSchoolService: SanisSchoolService,
		private readonly sanisUserService: SanisUserService
	) {
		super();
	}

	override async apply(params: SanisStrategyData): Promise<ProvisioningDto> {
		const data: SanisResponse = await this.getSanisCustomUserinfo(params);

		const school: SchoolDO = await this.sanisSchoolService.provisionSchool(data, params.systemId);

		if (!school.id) {
			throw new InternalServerErrorException(
				`Provisioning of sanis strategy: ${data.pid} failed. No school id supplied.`
			);
		}

		const user: UserDO = await this.sanisUserService.provisionUser(data, params.systemId, school.id);

		return new ProvisioningDto({ externalUserId: user.externalId as string });
	}

	private async getSanisCustomUserinfo(params: SanisStrategyData): Promise<SanisResponse> {
		const axiosConfig: AxiosRequestConfig = {
			headers: { Authorization: `Bearer ${params.accessToken}` },
		};

		const axiosResponse: AxiosResponse<SanisResponse> = await firstValueFrom(
			this.httpService.get(`${params.provisioningUrl}`, axiosConfig)
		);

		return axiosResponse.data;
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.SANIS;
	}
}
