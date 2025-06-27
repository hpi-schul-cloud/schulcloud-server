import { Instance, InstanceService } from '@modules/instance';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ManagementSeedDataConfig } from '../config';

@Injectable()
export class InstancesSeedDataService {
	constructor(
		private readonly configService: ConfigService<ManagementSeedDataConfig, true>,
		private readonly instanceService: InstanceService
	) {}

	public async import(): Promise<number> {
		const instanceName: string = this.configService.getOrThrow<string>('SC_SHORTNAME');
		const instance: Instance = new Instance({ id: '666076ad83d1e69b5c692efd', name: instanceName });

		await this.instanceService.save(instance);

		return 1;
	}
}
