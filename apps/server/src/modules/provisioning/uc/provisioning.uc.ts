import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Logger } from '@src/core/logger';
import { ProvisioningSystemInputDto } from '@src/modules/provisioning/dto/provisioning-system-input.dto';
import { ProvisioningSystemInputMapper } from '@src/modules/provisioning/mapper/provisioning-system-input.mapper';
import { SanisProvisioningStrategy } from '@src/modules/provisioning/strategy/sanis/sanis.strategy';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';

@Injectable()
export class ProvisioningUc {
	constructor(
		private readonly systemUc: SystemUc,
		private readonly sanisStrategy: SanisProvisioningStrategy,
		private readonly logger: Logger
	) {
		this.logger.setContext(ProvisioningUc.name);
	}

	async process(accessToken: string, systemId: string): Promise<ProvisioningDto> {
		let system: ProvisioningSystemInputDto;
		try {
			system = ProvisioningSystemInputMapper.mapToInternal(await this.systemUc.findById(systemId));
		} catch (e) {
			this.logger.error(`System with id ${systemId} was not found.`);
			throw new HttpException(`System with id "${systemId}" does not exist.`, HttpStatus.UNPROCESSABLE_ENTITY);
		}

		switch (system.provisioningStrategy) {
			case SystemProvisioningStrategy.SANIS: {
				const params = {
					provisioningUrl: system.provisioningUrl ?? '',
					accessToken,
				};
				return this.sanisStrategy.apply(params);
			}
			case SystemProvisioningStrategy.ISERV: {
				// TODO Iserv strategy
				const params = {
					provisioningUrl: system.provisioningUrl ?? '',
					accessToken,
				};
				return this.sanisStrategy.apply(params);
			}
			default:
				this.logger.error(`Missing provisioning strategy for system with id ${systemId}`);
				throw new HttpException(`Provisioning Strategy is not defined.`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
