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

	public async getSystems(id: EntityId[]): Promise<System[]> {
		const systems = await this.systemRepo.getSystemsByIds(id);

		return systems;
	}

	public async findAllForLdapLogin(): Promise<System[]> {
		const systems = await this.systemRepo.findAllForLdapLogin();

		return systems;
	}

	public async delete(domainObject: System): Promise<boolean> {
		const deleted: boolean = await this.systemRepo.delete(domainObject);

		return deleted;
	}
}
