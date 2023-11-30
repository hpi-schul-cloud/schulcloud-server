import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { SystemEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { System, SystemProps } from '../domain';
import { SystemDomainMapper } from './system-domain.mapper';

@Injectable()
export class SystemRepo {
	constructor(private readonly em: EntityManager) {}

	public async findById(id: EntityId): Promise<System | null> {
		const entity: SystemEntity | null = await this.em.findOne(SystemEntity, { id });

		if (!entity) {
			return null;
		}

		const props: SystemProps = SystemDomainMapper.mapEntityToDomainObjectProperties(entity);

		const domainObject: System = new System(props);

		return domainObject;
	}

	public async delete(domainObject: System): Promise<boolean> {
		const entity: SystemEntity | null = await this.em.findOne(SystemEntity, { id: domainObject.id });

		if (!entity) {
			return false;
		}

		await this.em.removeAndFlush(entity);

		return true;
	}
}
