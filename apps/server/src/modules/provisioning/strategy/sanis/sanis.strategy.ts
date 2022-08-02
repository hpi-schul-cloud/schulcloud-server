import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SanisResponse } from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { HttpService } from '@nestjs/axios';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { UserUc } from '@src/modules/user/uc';
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";
import {SanisResponseMapper} from "@src/modules/provisioning/strategy/sanis/sanis-response.mapper";

@Injectable()
export class SanisProvisioningStrategy extends ProvisioningStrategy<SanisResponse> {

	constructor(
		responseMapper: SanisResponseMapper,
		schoolUc: SchoolUc,
		userUc: UserUc,
		private readonly httpService: HttpService
	) {
		super(responseMapper, schoolUc, userUc);
		this.config = {};
	}

	initAuth(token: string) {
		this.config = { headers: { Authorization: `Bearer ${token}` }};
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
