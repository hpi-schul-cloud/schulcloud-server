import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SanisResponse } from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { HttpService } from '@nestjs/axios';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { UserUc } from '@src/modules/user/uc';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { SanisResponseMapper } from '@src/modules/provisioning/strategy/sanis/sanis-response.mapper';

export type SanisStrategyData = {
	provisioningUrl: string;
	accessToken: string;
};

@Injectable()
export class SanisProvisioningStrategy extends ProvisioningStrategy<SanisResponse, SanisStrategyData> {
	constructor(
		responseMapper: SanisResponseMapper,
		schoolUc: SchoolUc,
		userUc: UserUc,
		private readonly httpService: HttpService
	) {
		super(responseMapper, schoolUc, userUc);
	}

	override getProvisioningData(config: SanisStrategyData): Promise<SanisResponse> {
		if (!config.provisioningUrl) {
			throw new UnprocessableEntityException('Provisioning not initialized');
		}

		const axiosConfig: AxiosRequestConfig = {
			headers: { Authorization: `Bearer ${config.accessToken}` },
		};

		return firstValueFrom(this.httpService.get(`${config.provisioningUrl}`, axiosConfig)).then(
			(r: AxiosResponse<SanisResponse>) => {
				return r.data;
			}
		);
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.SANIS;
	}
}
