import { Inject, Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain/types';
import { System, SYSTEM_REPO, SystemQuery, SystemRepo } from '../domain';

@Injectable()
export class SystemService {
	constructor(@Inject(SYSTEM_REPO) private readonly systemRepo: SystemRepo) {}

	async find(filter: SystemQuery): Promise<System[]> {
		const systems: System[] = await this.systemRepo.find(filter);

		return systems;
	}

	public async findById(id: EntityId): Promise<System | null> {
		const system: System | null = await this.systemRepo.getSystemById(id);

		return system;
	}

	public async findByIdOrFail(id: EntityId): Promise<System> {
		const system: System | null = await this.systemRepo.getSystemById(id);

		if (!system) {
			throw new NotFoundLoggableException(System.name, { id });
		}

		return system;
	}

	public async getSystems(id: EntityId[]): Promise<System[]> {
		const systems: System[] = await this.systemRepo.getSystemsByIds(id);

		return systems;
	}

	public async findAllForLdapLogin(): Promise<System[]> {
		const systems: System[] = await this.systemRepo.findAllForLdapLogin();

		return systems;
	}

	public async findByOauth2Issuer(issuer: EntityId): Promise<System | null> {
		const system: System | null = await this.systemRepo.findByOauth2Issuer(issuer);

		return system;
	}

	public async delete(domainObject: System): Promise<boolean> {
		await this.systemRepo.delete(domainObject);

		return true;
	}
}
