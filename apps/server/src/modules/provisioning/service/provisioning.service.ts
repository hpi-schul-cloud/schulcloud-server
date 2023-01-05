import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OauthProvisioningInputDto, ProvisioningSystemInputDto, ProvisioningDataResponseDto, ProvisioningDto } from '../dto';
import { ProvisioningSystemInputMapper } from '../mapper/provisioning-system-input.mapper';
import {
	OidcProvisioningStrategy,
	IservProvisioningStrategy,
	SanisProvisioningStrategy,
	ProvisioningStrategy
} from '../strategy';
import { SystemService } from '@src/modules/system';
import { MigrationService } from './migration.service';
import { MigrationOutputDto } from '../dto/migration-output.dto';
import { UserService } from '@src/modules/user';

@Injectable()
export class ProvisioningService {
	strategies: Map<SystemProvisioningStrategy, ProvisioningStrategy<ProvisioningDataResponseDto>> = new Map<SystemProvisioningStrategy, ProvisioningStrategy<ProvisioningDataResponseDto>>();

	constructor(
		private readonly systemService: SystemService,
		private readonly userService: UserService,
		private readonly sanisStrategy: SanisProvisioningStrategy,
		private readonly iservStrategy: IservProvisioningStrategy,
		private readonly oidcStrategy: OidcProvisioningStrategy,
		private readonly migrationService: MigrationService,
	) {
		this.registerStrategy(sanisStrategy);
		this.registerStrategy(iservStrategy);
		this.registerStrategy(oidcStrategy);
	}

	protected registerStrategy(strategy: ProvisioningStrategy<ProvisioningDataResponseDto>) {
		this.strategies.set(strategy.getType(), strategy);
	}

	async process(accessToken: string, idToken: string, systemId: string): Promise<ProvisioningDto> {
		const system: ProvisioningSystemInputDto = await this.determineInput(systemId);
		const input: OauthProvisioningInputDto = new OauthProvisioningInputDto({
			accessToken,
			idToken,
			system
		});

		const strategy: ProvisioningStrategy<ProvisioningDataResponseDto> | undefined = this.strategies.get(system.provisioningStrategy);
		if(!strategy) {
			throw new InternalServerErrorException('Provisioning Strategy is not defined.');
		}

		const data: ProvisioningDataResponseDto = await strategy.fetch(input);

		if(data.officialSchoolNumber) {
			const userExists: boolean = this.userService.findByExternalId(data.externalUserId, system.systemId);
			const migration: boolean = this.migrationService.isSchoolInMigration(data.officialSchoolNumber);

			if(!userExists && migration) {
				// no provisioning
				const redirect: string = this.migrationService.getMigrationStrategy(migration, systemId);
				return redirect;
			}
		}

		const provisioningDto: ProvisioningDto = await strategy.apply(data);
		return provisioningDto;
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

	private async checkMigration(officialSchoolNumber: string) {
		const migration: MigrationOutputDto = await this.migrationService.checkMigrationForSchool(officialSchoolNumber);

		return migration;
	}


}
