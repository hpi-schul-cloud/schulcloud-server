import { EntityName } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { SchoolEntity } from '@modules/school/repo';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { EntityId } from '@shared/domain/types';
import { Condition } from 'mongodb';
import { ExternalToolEntity, ExternalToolRepoMapper } from '../../../external-tool/repo';
import { SchoolExternalTool } from '../../domain';
import { SchoolExternalToolQuery } from '../../uc/dto/school-external-tool.types';
import { SchoolExternalToolEntity, SchoolExternalToolEntityProps } from './school-external-tool.entity';
import { SchoolExternalToolScope } from './school-external-tool.scope';

@Injectable()
export class SchoolExternalToolRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName(): EntityName<SchoolExternalToolEntity> {
		return SchoolExternalToolEntity;
	}

	public async save(domainObject: SchoolExternalTool): Promise<SchoolExternalTool> {
		const existing: SchoolExternalToolEntity | null = await this.em.findOne<SchoolExternalToolEntity>(
			SchoolExternalToolEntity.name,
			domainObject.id
		);

		const entityProps: SchoolExternalToolEntityProps = this.mapDomainObjectToEntityProps(domainObject);
		let entity: SchoolExternalToolEntity = new SchoolExternalToolEntity(entityProps);

		if (existing) {
			entity = this.em.assign(existing, entity);
		} else {
			this.em.persist(entity);
		}
		await this.em.flush();

		const savedDomainObject: SchoolExternalTool = Object.assign(this.mapEntityToDomainObject(entity), {
			...domainObject,
		});

		return savedDomainObject;
	}

	public async findById(id: EntityId): Promise<SchoolExternalTool> {
		const entity: SchoolExternalToolEntity = await this.em.findOneOrFail(this.entityName, { id });
		const domainObject: SchoolExternalTool = this.mapEntityToDomainObject(entity);

		return domainObject;
	}

	public deleteById(id: EntityId): Promise<void> {
		return this.em.remove(this.em.getReference(this.entityName, id)).flush();
	}

	public async findByExternalToolId(toolId: string): Promise<SchoolExternalTool[]> {
		const entities: SchoolExternalToolEntity[] = await this.em.find(this.entityName, { tool: toolId });
		const domainObjects: SchoolExternalTool[] = entities.map((entity: SchoolExternalToolEntity): SchoolExternalTool => {
			const domainObject: SchoolExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		});
		return domainObjects;
	}

	public async findBySchoolId(schoolId: string): Promise<SchoolExternalTool[]> {
		const entities: SchoolExternalToolEntity[] = await this.em.find(this.entityName, { school: schoolId });
		const domainObjects: SchoolExternalTool[] = entities.map((entity: SchoolExternalToolEntity): SchoolExternalTool => {
			const domainObject: SchoolExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		});

		return domainObjects;
	}

	public deleteByExternalToolId(toolId: string): Promise<number> {
		const count: Promise<number> = this.em.nativeDelete(this.entityName, { tool: toolId });

		return count;
	}

	public async find(query: SchoolExternalToolQuery): Promise<SchoolExternalTool[]> {
		const scope: SchoolExternalToolScope = this.buildScope(query);

		const entities: SchoolExternalToolEntity[] = await this.em.find(this.entityName, scope.query);

		const dos: SchoolExternalTool[] = entities.map((entity: SchoolExternalToolEntity) =>
			this.mapEntityToDomainObject(entity)
		);
		return dos;
	}

	public async findSchoolIdsForToolId(toolId: string): Promise<EntityId[]> {
		// Since we don't need any of the EntityManager's features here, we load the ids with a Mongo query to be more efficient.
		const objectIds = await this.em
			.getCollection(this.entityName)
			.distinct('school', { tool: new ObjectId(toolId) } as Condition<SchoolExternalToolEntity>);
		const ids = objectIds.map((id) => id.toString());

		return ids;
	}

	public async saveMany(domainObjects: SchoolExternalTool[]): Promise<void> {
		const entities = domainObjects.map((domainObject) => {
			const entityProps = this.mapDomainObjectToEntityProps(domainObject);
			return new SchoolExternalToolEntity(entityProps);
		});

		await this.em.upsertMany(SchoolExternalToolEntity, entities);
	}

	private buildScope(query: SchoolExternalToolQuery): SchoolExternalToolScope {
		const scope: SchoolExternalToolScope = new SchoolExternalToolScope();

		scope.bySchoolId(query.schoolId);
		scope.byToolId(query.toolId);
		scope.byIsDeactivated(query.isDeactivated);
		scope.allowEmptyQuery(true);

		return scope;
	}

	private mapEntityToDomainObject(entity: SchoolExternalToolEntity): SchoolExternalTool {
		return new SchoolExternalTool({
			id: entity.id,
			toolId: entity.tool.id,
			schoolId: entity.school.id,
			parameters: ExternalToolRepoMapper.mapCustomParameterEntryEntitiesToDOs(entity.schoolParameters),
			isDeactivated: entity.isDeactivated,
		});
	}

	private mapDomainObjectToEntityProps(entityDO: SchoolExternalTool): SchoolExternalToolEntityProps {
		return {
			id: entityDO.id,
			school: this.em.getReference(SchoolEntity, entityDO.schoolId),
			tool: this.em.getReference(ExternalToolEntity, entityDO.toolId),
			schoolParameters: ExternalToolRepoMapper.mapCustomParameterEntryDOsToEntities(entityDO.parameters),
			isDeactivated: entityDO.isDeactivated,
		};
	}
}
