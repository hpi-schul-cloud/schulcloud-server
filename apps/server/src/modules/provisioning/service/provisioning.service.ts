import { System, SystemService } from '@modules/system';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OauthDataDto, OauthDataStrategyInputDto, ProvisioningDto, ProvisioningSystemDto } from '../dto';
import { ProvisioningSystemInputMapper } from '../mapper/provisioning-system-input.mapper';
import {
	OidcMockProvisioningStrategy,
	ProvisioningStrategy,
	SchulconnexAsyncProvisioningStrategy,
	TspProvisioningStrategy,
} from '../strategy';

@Injectable()
export class ProvisioningService {
	private readonly strategies: Map<SystemProvisioningStrategy, ProvisioningStrategy> = new Map<
		SystemProvisioningStrategy,
		ProvisioningStrategy
	>();

	constructor(
		private readonly systemService: SystemService,
		private readonly schulconnexAsyncProvisioningStrategy: SchulconnexAsyncProvisioningStrategy,
		private readonly oidcMockStrategy: OidcMockProvisioningStrategy,
		private readonly tspStrategy: TspProvisioningStrategy
	) {
		this.registerStrategy(schulconnexAsyncProvisioningStrategy);
		this.registerStrategy(oidcMockStrategy);
		this.registerStrategy(tspStrategy);
	}

	protected registerStrategy(strategy: ProvisioningStrategy): void {
		this.strategies.set(strategy.getType(), strategy);
	}

	public async getData(systemId: string, idToken: string, accessToken: string): Promise<OauthDataDto> {
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
		const systemDto: System = await this.systemService.findByIdOrFail(systemId);

		const inputDto: ProvisioningSystemDto = ProvisioningSystemInputMapper.mapToInternal(systemDto);

		return inputDto;
	}

	public async provisionData(oauthData: OauthDataDto): Promise<ProvisioningDto> {
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
