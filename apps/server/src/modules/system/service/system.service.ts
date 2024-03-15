import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SYSTEM_REPO, System, SystemRepo } from '../domain';

@Injectable()
export class SystemService {
	constructor(@Inject(SYSTEM_REPO) private readonly systemRepo: SystemRepo) {}

	public async findById(id: EntityId): Promise<System | null> {
		const system = await this.systemRepo.getSystemById(id);

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
		await this.systemRepo.delete(domainObject);

		return true;
	}
}
