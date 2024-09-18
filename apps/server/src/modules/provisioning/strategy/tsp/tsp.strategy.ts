import { Injectable, NotImplementedException } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OauthDataDto, OauthDataStrategyInputDto, ProvisioningDto } from '../../dto';
import { TspProvisioningService } from '../../service/tsp-provisioning.service';
import { ProvisioningStrategy } from '../base.strategy';
import { BadDataLoggableException } from '../loggable';

@Injectable()
export class TspProvisioningStrategy extends ProvisioningStrategy {
	constructor(private readonly provisioningService: TspProvisioningService) {
		super();
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.TSP;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		// TODO EW-1004
		throw new NotImplementedException();
	}

	override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
		if (!data.externalSchool) throw new BadDataLoggableException('External school is missing', { data });
		if (!data.externalClasses) throw new BadDataLoggableException('External classes are missing', { data });

		const school = await this.provisioningService.findSchoolOrFail(data.system, data.externalSchool);
		const user = await this.provisioningService.provisionUser(data, school);

		await this.provisioningService.provisionClasses(school, data.externalClasses, user);

		return new ProvisioningDto({ externalUserId: user.externalId || data.externalUser.externalId });
	}
}
