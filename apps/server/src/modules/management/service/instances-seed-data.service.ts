import { Instance, InstanceService } from '@modules/instance';
import { Inject, Injectable } from '@nestjs/common';
import { MANAGEMENT_SEED_DATA_CONFIG_TOKEN, ManagementSeedDataConfig } from '../management-seed-data.config';

@Injectable()
export class InstancesSeedDataService {
	constructor(
		@Inject(MANAGEMENT_SEED_DATA_CONFIG_TOKEN) private readonly config: ManagementSeedDataConfig,
		private readonly instanceService: InstanceService
	) {}

	public async import(): Promise<number> {
		const instanceName: string = this.config.scShortName;
		const instance: Instance = new Instance({ id: '666076ad83d1e69b5c692efd', name: instanceName });

		await this.instanceService.save(instance);

		return 1;
	}
}
