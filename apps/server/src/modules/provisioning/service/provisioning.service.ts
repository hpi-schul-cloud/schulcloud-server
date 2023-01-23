import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { OauthDataDto, OauthDataStrategyInputDto, ProvisioningDto, ProvisioningSystemDto } from '../dto';
import { ProvisioningSystemInputMapper } from '../mapper/provisioning-system-input.mapper';
import {
	IservProvisioningStrategy,
	OidcMockProvisioningStrategy,
	ProvisioningStrategy,
	SanisProvisioningStrategy,
} from '../strategy';

@Injectable()
export class ProvisioningService {
	strategies: Map<SystemProvisioningStrategy, ProvisioningStrategy> = new Map<
		SystemProvisioningStrategy,
		ProvisioningStrategy
	>();

	constructor(
		private readonly systemService: SystemService,
		private readonly sanisStrategy: SanisProvisioningStrategy,
		private readonly iservStrategy: IservProvisioningStrategy,
		private readonly oidcMockStrategy: OidcMockProvisioningStrategy
	) {
		this.registerStrategy(sanisStrategy);
		this.registerStrategy(iservStrategy);
		this.registerStrategy(oidcMockStrategy);
	}

	protected registerStrategy(strategy: ProvisioningStrategy) {
		this.strategies.set(strategy.getType(), strategy);
	}

	async getData(accessToken: string, idToken: string, systemId: string): Promise<OauthDataDto> {
		const system: ProvisioningSystemDto = await this.determineInput(systemId);
		const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
			accessToken,
			idToken,
			system,
		});

		const strategy: ProvisioningStrategy = this.getProvisioningStrategy(system.provisioningStrategy);

		const data: OauthDataDto = await strategy.getData(input);
		return data;
	}

	private async determineInput(systemId: string): Promise<ProvisioningSystemDto> {
		const systemDto: SystemDto = await this.systemService.findById(systemId);
		const inputDto: ProvisioningSystemDto = ProvisioningSystemInputMapper.mapToInternal(systemDto);
		return inputDto;
	}

	async provisionData(oauthData: OauthDataDto): Promise<ProvisioningDto> {
		const strategy: ProvisioningStrategy = this.getProvisioningStrategy(oauthData.system.provisioningStrategy);
		const provisioningDto: Promise<ProvisioningDto> = strategy.apply(oauthData);
		return provisioningDto;
	}

	private getProvisioningStrategy(systemStrategy: SystemProvisioningStrategy): ProvisioningStrategy {
		const strategy: ProvisioningStrategy | undefined = this.strategies.get(systemStrategy);

		if (!strategy) {
			throw new InternalServerErrorException('Provisioning Strategy is not defined.');
		}

		return strategy;
	}
}
