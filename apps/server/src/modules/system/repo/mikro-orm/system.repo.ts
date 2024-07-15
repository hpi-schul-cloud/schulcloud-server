import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { EntityId, SystemTypeEnum } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { System, SystemQuery, SystemRepo } from '../../domain';
import { SystemEntity } from '../../entity';
import { SystemEntityMapper } from './mapper';
import { SystemScope } from './scope';

@Injectable()
export class SystemMikroOrmRepo extends BaseDomainObjectRepo<System, SystemEntity> implements SystemRepo {
	protected get entityName(): EntityName<SystemEntity> {
		return SystemEntity;
	}

	protected mapDOToEntityProperties(): EntityData<SystemEntity> {
		throw new NotImplementedException('Method `mapDOToEntityProperties` not implemented.');
	}

	public async find(filter: SystemQuery): Promise<System[]> {
		const scope: SystemScope = new SystemScope().byTypes(filter.types).allowEmptyQuery(true);

		const entities: SystemEntity[] = await this.em.find(SystemEntity, scope.query);

		const domainObjects: System[] = entities.map((entity: SystemEntity) => SystemEntityMapper.mapToDo(entity));

		return domainObjects;
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
		const entities: SystemEntity[] = await this.em.find(SystemEntity, {
			type: SystemTypeEnum.LDAP,
			ldapConfig: { active: true },
			oauthConfig: undefined,
		});

		const domainObjects: System[] = entities.map((entity) => SystemEntityMapper.mapToDo(entity));

		return domainObjects;
	}
}
