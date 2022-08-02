import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SanisResponse } from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { HttpService } from '@nestjs/axios';
import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { UserUc } from '@src/modules/user/uc';
import {firstValueFrom, Observable} from "rxjs";
import {AxiosRequestConfig, AxiosResponse} from "axios";

@Injectable()
export class SanisProvisioningStrategy extends ProvisioningStrategy<SanisResponse> {

	private readonly provisioningUrl: string;

	private config: AxiosRequestConfig;

	constructor(
		responseMapper: IProviderResponseMapper<SanisResponse>,
		schoolUc: SchoolUc,
		userUc: UserUc,
		private readonly httpService: HttpService
	) {
		super(responseMapper, schoolUc, userUc);
		this.config = {};
		this.provisioningUrl = Configuration.get("SANIS_PROVISIONING_URL") as string;
	}

	initAuth(token: string) {
		this.config = { headers: { Authorization: `Bearer ${token}` }};
	}

	override async apply(system: System): Promise<ProvisioningDto> {
		return super.apply(system);
	}

	override getProvisioningData(): Promise<SanisResponse> {
		return firstValueFrom(this.httpService.get(`${this.provisioningUrl}`, this.config))
			.then((r: AxiosResponse<SanisResponse>) => {
			return r.data;
		});
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.SANIS;
	}
}
