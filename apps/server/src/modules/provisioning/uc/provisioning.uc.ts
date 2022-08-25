import { Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { Logger } from '@src/core/logger';
import { ProvisioningSystemInputDto } from '@src/modules/provisioning/dto/provisioning-system-input.dto';
import { ProvisioningSystemInputMapper } from '@src/modules/provisioning/mapper/provisioning-system-input.mapper';
import { SanisProvisioningStrategy, SanisStrategyData } from '@src/modules/provisioning/strategy/sanis/sanis.strategy';
import { IservProvisioningStrategy, IservStrategyData } from '@src/modules/provisioning/strategy/iserv/iserv.strategy';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';

@Injectable()
export class ProvisioningUc {
	constructor(
		private readonly systemUc: SystemUc,
		private readonly sanisStrategy: SanisProvisioningStrategy,
		private readonly iservStrategy: IservProvisioningStrategy,
		private readonly logger: Logger
	) {
		this.logger.setContext(ProvisioningUc.name);
	}

	async process(accessToken: string, idToken: string, systemId: string): Promise<ProvisioningDto> {
		let system: ProvisioningSystemInputDto;
		try {
			system = ProvisioningSystemInputMapper.mapToInternal(await this.systemUc.findById(systemId));
		} catch (e) {
			this.logger.error(`System with id ${systemId} was not found.`);
			throw new UnprocessableEntityException(`System with id "${systemId}" does not exist.`);
		}

		switch (system.provisioningStrategy) {
			case SystemProvisioningStrategy.SANIS: {
				if (!system.provisioningUrl) {
					throw new UnprocessableEntityException(`Sanis system with id: ${systemId} is missing a provisioning url`);
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
				this.logger.error(`Missing provisioning strategy for system with id ${systemId}`);
				throw new InternalServerErrorException('Provisioning Strategy is not defined.');
		}
	}
}
