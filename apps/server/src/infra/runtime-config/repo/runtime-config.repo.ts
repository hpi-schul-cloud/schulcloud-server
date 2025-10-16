import { Inject, Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { RuntimeConfigDefault, RuntimeConfigValue } from '../domain/runtime-config-value.do';
import { RuntimeConfigEntity } from './entity/runtime-config.entity';
import { RuntimeConfigRepo } from '../domain/runtime-config.repo.interface';
import { EntityData, EntityName } from '@mikro-orm/core/typings';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { RuntimeConfigValueFactory } from './runtime-config-value.factory';
import { RUNTIME_CONFIG_DEFAULTS } from '../injection-keys';
import { RuntimeConfigEntityMapper } from './runtime-config.entity-mapper';

@Injectable()
export class RuntimeConfigMikroOrmRepo
	extends BaseDomainObjectRepo<RuntimeConfigValue, RuntimeConfigEntity>
	implements RuntimeConfigRepo
{
	constructor(
		protected readonly _em: EntityManager,
		@Inject(RUNTIME_CONFIG_DEFAULTS) private defaults: RuntimeConfigDefault[]
	) {
		super(_em);
	}

	get entityName(): EntityName<RuntimeConfigEntity> {
		this._em.getRepository(RuntimeConfigEntity);
		return RuntimeConfigEntity;
	}

	public async getAll(): Promise<RuntimeConfigValue[]> {
		const entities = await this._em.find(RuntimeConfigEntity, {});
		const entityMap = new Map(entities.map((e) => [e.key, e]));
		const values = this.defaults.map((def) => {
			const entity = entityMap.get(def.key) || null;
			return this.mapEntityOrDefaultToDo(def.key, entity);
		});

		return values;
	}

	public async getByKey(key: string): Promise<RuntimeConfigValue> {
		const entity = await this._em.findOne(RuntimeConfigEntity, { key });

		const result = this.mapEntityOrDefaultToDo(key, entity);

		return result;
	}

	private mapEntityOrDefaultToDo(key: string, entity: RuntimeConfigEntity | null): RuntimeConfigValue {
		const defaultConfig = this.defaults.find((def) => def.key === key);

		if (!defaultConfig) {
			throw new Error(`Runtime Config for key: ${key} does not exist`);
		}
		return entity
			? RuntimeConfigEntityMapper.toDomainObject(entity)
			: RuntimeConfigValueFactory.build({ ...defaultConfig, id: new ObjectId().toHexString() });
	}

	protected mapDOToEntityProperties(domainObject: RuntimeConfigValue): EntityData<RuntimeConfigEntity> {
		return RuntimeConfigEntityMapper.toEntityProperties(domainObject);
	}
}
