import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import {
	AnyProvisioningOptions,
	SchoolSystemOptions,
	SchoolSystemOptionsBuilder,
	SchoolSystemOptionsProps,
} from '../domain';
import { SchoolSystemOptionsEntity, SchoolSystemOptionsEntityProps } from '../entity';
import { MissingProvisioningStrategyLoggableException } from '../loggable';
import { SchoolSystemOptionsRepoMapper } from './school-system-options-repo.mapper';

@Injectable()
export class SchoolSystemOptionsRepo {
	constructor(private readonly em: EntityManager) {}

	public async findBySchoolIdAndSystemId(schoolId: EntityId, systemId: EntityId): Promise<SchoolSystemOptions | null> {
		const entity: SchoolSystemOptionsEntity | null = await this.em.findOne(
			SchoolSystemOptionsEntity,
			{
				school: schoolId,
				system: systemId,
			},
			{ populate: ['system.provisioningStrategy'] }
		);

		if (!entity) {
			return null;
		}

		const domainObject: SchoolSystemOptions = this.buildDomainObject(entity);

		return domainObject;
	}

	public async save(domainObject: SchoolSystemOptions): Promise<SchoolSystemOptions> {
		const entityProps: SchoolSystemOptionsEntityProps = SchoolSystemOptionsRepoMapper.mapDomainObjectToEntityProperties(
			domainObject,
			this.em
		);

		const newEntity: SchoolSystemOptionsEntity = new SchoolSystemOptionsEntity(entityProps);

		const existingEntity: SchoolSystemOptionsEntity | null = await this.em.findOne(SchoolSystemOptionsEntity, {
			id: domainObject.id,
		});

		let savedEntity: SchoolSystemOptionsEntity;
		if (existingEntity) {
			savedEntity = this.em.assign(existingEntity, newEntity);
		} else {
			this.em.persist(newEntity);

			savedEntity = newEntity;
		}

		await this.em.flush();

		await this.em.populate(savedEntity, ['system.provisioningStrategy']);

		const savedDomainObject: SchoolSystemOptions = this.buildDomainObject(savedEntity);

		return savedDomainObject;
	}

	private buildDomainObject(entity: SchoolSystemOptionsEntity): SchoolSystemOptions {
		if (!entity.system.provisioningStrategy) {
			throw new MissingProvisioningStrategyLoggableException(entity.system.id);
		}

		const provisioningOptions: AnyProvisioningOptions = new SchoolSystemOptionsBuilder(
			entity.system.provisioningStrategy
		).buildProvisioningOptions(entity.provisioningOptions);

		const props: SchoolSystemOptionsProps<AnyProvisioningOptions> =
			SchoolSystemOptionsRepoMapper.mapEntityToDomainObjectProperties(entity, provisioningOptions);

		const domainObject: SchoolSystemOptions = new SchoolSystemOptions<AnyProvisioningOptions>(props);

		return domainObject;
	}
}
