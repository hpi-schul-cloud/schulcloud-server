import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { System } from '../domain';
import { SystemRepo } from '../repo';

@Injectable()
export class SystemService {
	constructor(private readonly systemRepo: SystemRepo) {}

	public async findById(id: EntityId): Promise<System | null> {
		const system: System | null = await this.systemRepo.findById(id);

		return system;
	}

	public async findAllForLdapLogin(): Promise<System[]> {
		const systems = await this.systemRepo.findAll();

		const systemsForLdapLogin = systems.filter((system) => system.isEligibleForLdapLogin());

		return systemsForLdapLogin;
	}

	public async delete(domainObject: System): Promise<boolean> {
		const deleted: boolean = await this.systemRepo.delete(domainObject);

		return deleted;
	}
}
