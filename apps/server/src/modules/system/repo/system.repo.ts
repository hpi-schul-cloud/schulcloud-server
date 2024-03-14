import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { SystemEntity } from '@shared/domain/entity';
import { EntityId, SystemTypeEnum } from '@shared/domain/types';
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

		const domainObject = this.mapToDo(entity);

		return domainObject;
	}

	public async findAllForLdapLogin(): Promise<System[]> {
		// Systems with an oauthConfig are filtered out here to exclude IServ. IServ is of type LDAP for syncing purposes, but the login is done via OAuth2.
		const entities: SystemEntity[] = await this.em.find(SystemEntity, {
			type: SystemTypeEnum.LDAP,
			ldapConfig: { active: true },
			oauthConfig: undefined,
		});

		const domainObjects = this.mapToDos(entities);

		return domainObjects;
	}

	async getSystemsByIds(ids: EntityId[]): Promise<System[]> {
		const entities: SystemEntity[] = await this.em.find(SystemEntity, {
			id: { $in: ids },
		});

		const domainObjects = this.mapToDos(entities);

		return domainObjects;
	}

	private mapToDos(entities: SystemEntity[]) {
		const domainObjects: System[] = entities.map((entity) => this.mapToDo(entity));

		return domainObjects;
	}

	private mapToDo(entity: SystemEntity) {
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
