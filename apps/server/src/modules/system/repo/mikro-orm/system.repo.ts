import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { SystemEntity } from '@shared/domain/entity';
import { EntityId, SystemTypeEnum } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { System, SystemRepo } from '../../domain';
import { SystemEntityMapper } from './mapper/system-entity.mapper';
import { SystemScope } from './scope/system.scope';

@Injectable()
export class SystemMikroOrmRepo extends BaseDomainObjectRepo<System, SystemEntity> implements SystemRepo {
	protected get entityName(): EntityName<SystemEntity> {
		return SystemEntity;
	}

	protected mapDOToEntityProperties(): EntityData<SystemEntity> {
		throw new NotImplementedException('Method `mapDOToEntityProperties` not implemented.');
	}

	public async getSystemById(id: EntityId): Promise<System | null> {
		const entity: SystemEntity | null = await this.em.findOne(SystemEntity, { id });

		if (!entity) {
			return null;
		}

		const domainObject = SystemEntityMapper.mapToDo(entity);

		return domainObject;
	}

	public async getSystemsByIds(ids: EntityId[]): Promise<System[]> {
		const scope = new SystemScope();
		scope.byIds(ids);

		const entities: SystemEntity[] = await this.em.find(SystemEntity, scope.query);

		const domainObjects: System[] = entities.map((entity) => SystemEntityMapper.mapToDo(entity));

		return domainObjects;
	}

	public async findAllForLdapLogin(): Promise<System[]> {
		// Systems with an oauthConfig are filtered out here to exclude IServ. IServ is of type LDAP for syncing purposes, but the login is done via OAuth2.
		const entities: SystemEntity[] = await this.em.find(SystemEntity, {
			type: SystemTypeEnum.LDAP,
			ldapConfig: { active: true },
			oauthConfig: undefined,
		});

		const domainObjects: System[] = entities.map((entity) => SystemEntityMapper.mapToDo(entity));

		return domainObjects;
	}
}
