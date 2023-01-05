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
import { OauthProvisioningInputDto, ProvisioningDataResponseDto } from '../../dto';

export type SanisStrategyData = {
	provisioningUrl: string;
	accessToken: string;
	systemId: string;
};

// TODO
export type sanisdto = ProvisioningDataResponseDto & SanisResponse & {systemId: string};

@Injectable()
export class SanisProvisioningStrategy extends ProvisioningStrategy<sanisdto> {
	constructor(
		private readonly responseMapper: SanisResponseMapper,
		private readonly httpService: HttpService,
		private readonly sanisSchoolService: SanisSchoolService,
		private readonly sanisUserService: SanisUserService,
	) {
		super();
	}

	override async fetch(input: OauthProvisioningInputDto): Promise<sanisdto> {
		if (!input.system.provisioningUrl) {
			throw new InternalServerErrorException(`Sanis system with id: ${input.system.systemId} is missing a provisioning url`);
		}

		const axiosConfig: AxiosRequestConfig = {
			headers: { Authorization: `Bearer ${input.accessToken}` },
		};

		const axiosResponse: AxiosResponse<SanisResponse> = await firstValueFrom(
			this.httpService.get(`${input.system.provisioningUrl}`, axiosConfig)
		);

		return {
			systemId: input.system.systemId,
			externalUserId: axiosResponse.data.pid,
			officialSchoolNumber: axiosResponse.data.personenkontexte[0].id.toString(),
			...axiosResponse.data
		};
	}

	override async apply(data: sanisdto): Promise<ProvisioningDto> {
		const school: SchoolDO = await this.sanisSchoolService.provisionSchool(data, data.systemId);

		if (!school.id) {
			throw new InternalServerErrorException(
				`Provisioning of sanis strategy: ${data.pid} failed. No school id supplied.`
			);
		}

		const user: UserDO = await this.sanisUserService.provisionUser(data, data.systemId, school.id);

		return new ProvisioningDto({ externalUserId: user.externalId as string });
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.SANIS;
	}
}
