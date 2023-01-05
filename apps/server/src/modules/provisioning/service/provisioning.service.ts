import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SystemService } from '@src/modules/system';
import { UserService } from '@src/modules/user';
import { SchoolService } from '@src/modules/school';
import { OauthDataAdapterInputDto, ProvisioningDto, ProvisioningSystemDto } from '../dto';
import { ProvisioningSystemInputMapper } from '../mapper/provisioning-system-input.mapper';
import {
	IservProvisioningStrategy,
	OidcMockProvisioningStrategy,
	ProvisioningStrategy,
	SanisProvisioningStrategy,
} from '../strategy';
import { OauthDataDto } from '../dto/oauth-data.dto';
import { AccountUc } from '../../account/uc/account.uc';
import { RoleService } from '../../role';

@Injectable()
export class ProvisioningService {
	strategies: Map<SystemProvisioningStrategy, ProvisioningStrategy> = new Map<
		SystemProvisioningStrategy,
		ProvisioningStrategy
	>();

	constructor(
		private readonly systemService: SystemService,
		private readonly userService: UserService,
		private readonly schoolService: SchoolService,
		private readonly roleService: RoleService,
		private readonly accountUc: AccountUc,
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

	async fetchData(accessToken: string, idToken: string, systemId: string): Promise<OauthDataDto> {
		const system: ProvisioningSystemDto = await this.determineInput(systemId);
		const input: OauthDataAdapterInputDto = new OauthDataAdapterInputDto({
			accessToken,
			idToken,
			system,
		});

		const strategy: ProvisioningStrategy = this.getProvisioningStrategy(system.provisioningStrategy);

		const data: OauthDataDto = await strategy.fetch(input);
		return data;
	}

	private async determineInput(systemId: string): Promise<ProvisioningSystemDto> {
		try {
			const systemDto = await this.systemService.findById(systemId);
			const inputDto: ProvisioningSystemDto = ProvisioningSystemInputMapper.mapToInternal(systemDto);
			return inputDto;
		} catch (e) {
			throw new NotFoundException(`System with id "${systemId}" does not exist.`);
		}
	}

	async provisionOauthData(oauthData: OauthDataDto): Promise<ProvisioningDto> {
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
