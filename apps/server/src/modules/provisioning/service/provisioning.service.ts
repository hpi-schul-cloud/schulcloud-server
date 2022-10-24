import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningSystemInputDto } from '@src/modules/provisioning/dto/provisioning-system-input.dto';
import { ProvisioningSystemInputMapper } from '@src/modules/provisioning/mapper/provisioning-system-input.mapper';
import { SanisProvisioningStrategy, SanisStrategyData } from '@src/modules/provisioning/strategy/sanis/sanis.strategy';
import { IservProvisioningStrategy, IservStrategyData } from '@src/modules/provisioning/strategy/iserv/iserv.strategy';
import { OidcProvisioningStrategy, OidcStrategyData } from '@src/modules/provisioning/strategy/oidc/oidc.strategy';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { SystemService } from '@src/modules/system/service/system.service';

@Injectable()
export class ProvisioningService {
	constructor(
		private readonly systemService: SystemService,
		private readonly sanisStrategy: SanisProvisioningStrategy,
		private readonly iservStrategy: IservProvisioningStrategy,
		private readonly oidcProvisioningStrategy: OidcProvisioningStrategy,
	) {}

	async process(accessToken: string, idToken: string, systemId: string): Promise<ProvisioningDto> {
		const system: ProvisioningSystemInputDto = await this.determineInput(systemId);

		switch (system.provisioningStrategy) {
			case SystemProvisioningStrategy.SANIS: {
				const provisioningDtoPromise = this.provisionSanis(system, systemId, accessToken);
				return provisioningDtoPromise;
			}
			case SystemProvisioningStrategy.ISERV: {
				const provisioningDtoPromise = this.provisionIserv(idToken);
				return provisioningDtoPromise;
			}
			case SystemProvisioningStrategy.OIDC: {
				const provisioningDtoPromise = this.provisionOidc(idToken);
				return provisioningDtoPromise;
			}
			default:
				throw new InternalServerErrorException('Provisioning Strategy is not defined.');
		}
	}

	private async determineInput(systemId: string): Promise<ProvisioningSystemInputDto> {
		try {
			const systemDto = await this.systemService.findById(systemId);
			const inputDto: ProvisioningSystemInputDto = ProvisioningSystemInputMapper.mapToInternal(systemDto);
			return inputDto;
		} catch (e) {
			throw new NotFoundException(`System with id "${systemId}" does not exist.`);
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

	private provisionOidc(idToken: string): Promise<ProvisioningDto> {
		const params: OidcStrategyData = {
			idToken,
		};
		const provisioningDtoPromise = this.iservStrategy.apply(params);
		return provisioningDtoPromise;
	}
}
