import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Logger } from '@src/core/logger';
import { ProvisioningSystemInputDto } from '@src/modules/provisioning/dto/provisioning-system-input.dto';
import { ProvisioningSystemInputMapper } from '@src/modules/provisioning/mapper/provisioning-system-input.mapper';
import { PlaceholderProvisioningStrategy } from '@src/modules/provisioning/strategy/placeholder/placeholder.strategy';

@Injectable()
export class ProvisioningUc {
	constructor(
		private readonly systemUc: SystemUc,
		private readonly placeholderStrategy: PlaceholderProvisioningStrategy,
		private readonly logger: Logger
	) {
		this.logger.setContext(ProvisioningUc.name);
	}

	async process(sub: string, systemId: string): Promise<void> {
		let system: ProvisioningSystemInputDto;
		try {
			system = ProvisioningSystemInputMapper.mapToInternal(await this.systemUc.findById(systemId));
		} catch (e) {
			this.logger.error(`System with id ${systemId} was not found.`);
			throw new HttpException(`System with id "${systemId}" does not exist.`, HttpStatus.UNPROCESSABLE_ENTITY);
		}

		let strategy: ProvisioningStrategy<any>;
		switch (system.provisioningStrategy) {
			case SystemProvisioningStrategy.PLACEHOLDER:
				strategy = this.placeholderStrategy;
				break;
			default:
				this.logger.error(`Missing provisioning strategy for system with id ${systemId}`);
				throw new HttpException(`Provisioning Strategy is not defined.`, HttpStatus.INTERNAL_SERVER_ERROR);
		}

		await strategy.apply();
	}
}
