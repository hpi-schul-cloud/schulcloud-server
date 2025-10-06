import { Inject, Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { RuntimeConfigDefault, RuntimeConfigValue, RuntimeConfigValueAndType } from '../domain/runtime-config-value.do';
import { RuntimeConfigEntity } from './entity/runtime-config.entity';
import { RuntimeConfigRepo } from '../domain/runtime-config.repo.interface';
import { EntityData, EntityName } from '@mikro-orm/core/typings';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { RuntimeConfigValueFactory } from './runtime-config-value.factory';
import { RuntimeConfigValueInvalidDataLoggable } from '../domain/loggable/runtime-config-invalid-data.loggable';
import { RUNTIME_CONFIG_DEFAULTS } from '../injection-keys';

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
		const values = this.getAllConfigDOsDefinedInDefaults(entityMap);

		await this.removeConfigsNotInDefaults(entities);

		return values;
	}

	private getAllConfigDOsDefinedInDefaults(entityMap: Map<string, RuntimeConfigEntity>): RuntimeConfigValue[] {
		const configValues = this.defaults.map((def) => {
			const found = entityMap.get(def.key);
			if (found) {
				return this.mapToDo(found);
			} else {
				return RuntimeConfigValueFactory.build({ ...def, id: new ObjectId().toHexString() });
			}
		});
		return configValues;
	}

	private async removeConfigsNotInDefaults(entities: RuntimeConfigEntity[]): Promise<void> {
		const defaultsSet = new Set(this.defaults.map((d) => d.key));
		const toRemove = entities.filter((e) => !defaultsSet.has(e.key));
		if (toRemove.length > 0) {
			await this._em.removeAndFlush(toRemove);
		}
	}

	public async getByKey(key: string): Promise<RuntimeConfigValue> {
		const entity = await this._em.findOne(RuntimeConfigEntity, { key });
		const defaultConfig = this.defaults.find((def) => def.key === key);

		if (!defaultConfig) {
			if (entity) await this._em.removeAndFlush(entity);
			throw new Error(`Runtime Config for key: ${key} does not exist`);
		}

		return entity
			? this.mapToDo(entity)
			: RuntimeConfigValueFactory.build({ ...defaultConfig, id: new ObjectId().toHexString() });
	}

	protected mapToDo(entity: RuntimeConfigEntity): RuntimeConfigValue {
		const typeAndValue = this.getTypeAndValue(entity);
		return RuntimeConfigValueFactory.build({
			id: entity.id,
			key: entity.key,
			...typeAndValue,
			description: entity.description,
		});
	}

	private getTypeAndValue(entity: RuntimeConfigEntity): RuntimeConfigValueAndType {
		if (entity.type === 'string') {
			return { type: 'string', value: entity.value };
		}
		if (entity.type === 'number') {
			const value = Number(entity.value);
			if (isNaN(value)) {
				throw new RuntimeConfigValueInvalidDataLoggable(entity.key, entity.value, entity.type);
			}
			return { type: 'number', value: Number(entity.value) };
		}
		if (entity.type === 'boolean') {
			return { type: 'boolean', value: entity.value === 'true' };
		}
		throw new RuntimeConfigValueInvalidDataLoggable(entity.key, entity.value, entity.type);
	}

	protected mapDOToEntityProperties(domainObject: RuntimeConfigValue): EntityData<RuntimeConfigEntity> {
		const props = domainObject.getProps();
		return {
			key: props.key,
			type: props.type,
			value: props.value.toString(),
			description: props.description,
		};
	}
}
