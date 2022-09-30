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
				const provisioningDtoPromise = this.provisionSanis(system, systemId, accessToken);
				return provisioningDtoPromise;
			}
			case SystemProvisioningStrategy.ISERV: {
				const provisioningDtoPromise = this.provisionIserv(idToken);
				return provisioningDtoPromise;
			}
			default:
				throw new InternalServerErrorException('Provisioning Strategy is not defined.');
		}
	}

	private provisionIserv(idToken: string): Promise<ProvisioningDto> {
		const params: IservStrategyData = {
			idToken,
		};
		const provisioningDtoPromise = this.iservStrategy.apply(params);
		return provisioningDtoPromise;
	}

	private provisionSanis(
		system: ProvisioningSystemInputDto,
		systemId: string,
		accessToken: string
	): Promise<ProvisioningDto> {
		if (!system.provisioningUrl) {
			throw new InternalServerErrorException(`Sanis system with id: ${systemId} is missing a provisioning url`);
		}

		const params: SanisStrategyData = {
			provisioningUrl: system.provisioningUrl,
			accessToken,
			systemId,
		};
		const provisioningDtoPromise = this.sanisStrategy.apply(params);
		return provisioningDtoPromise;
	}
}
