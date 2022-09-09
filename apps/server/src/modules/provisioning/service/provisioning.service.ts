import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningSystemInputDto } from '@src/modules/provisioning/dto/provisioning-system-input.dto';
import { ProvisioningSystemInputMapper } from '@src/modules/provisioning/mapper/provisioning-system-input.mapper';
import { SanisProvisioningStrategy, SanisStrategyData } from '@src/modules/provisioning/strategy/sanis/sanis.strategy';
import { IservProvisioningStrategy, IservStrategyData } from '@src/modules/provisioning/strategy/iserv/iserv.strategy';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { SystemService } from '@src/modules/system/service/system.service';

@Injectable()
export class ProvisioningService {
	constructor(
		private readonly systemService: SystemService,
		private readonly sanisStrategy: SanisProvisioningStrategy,
		private readonly iservStrategy: IservProvisioningStrategy
	) {}

	async process(accessToken: string, idToken: string, systemId: string): Promise<ProvisioningDto> {
		let system: ProvisioningSystemInputDto;
		try {
			system = ProvisioningSystemInputMapper.mapToInternal(await this.systemService.findById(systemId));
		} catch (e) {
			throw new NotFoundException(`System with id "${systemId}" does not exist.`);
		}

		switch (system.provisioningStrategy) {
			case SystemProvisioningStrategy.SANIS: {
				if (!system.provisioningUrl) {
					throw new InternalServerErrorException(`Sanis system with id: ${systemId} is missing a provisioning url`);
				}

				const params: SanisStrategyData = {
					provisioningUrl: system.provisioningUrl,
					accessToken,
					systemId,
				};
				return this.sanisStrategy.apply(params);
			}
			case SystemProvisioningStrategy.ISERV: {
				const params: IservStrategyData = {
					idToken,
				};
				return this.iservStrategy.apply(params);
			}
			default:
				throw new InternalServerErrorException('Provisioning Strategy is not defined.');
		}
	}
}
