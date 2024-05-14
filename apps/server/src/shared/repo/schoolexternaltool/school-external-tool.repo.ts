import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { SchoolExternalToolEntity, SchoolExternalToolEntityProps } from '@modules/tool/school-external-tool/entity';
import { SchoolExternalToolQuery } from '@modules/tool/school-external-tool/uc/dto/school-external-tool.types';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { SchoolEntity } from '@shared/domain/entity';
import { EntityId } from '../../domain/types';
import { ExternalToolRepoMapper } from '../externaltool';
import { SchoolExternalToolScope } from './school-external-tool.scope';

@Injectable()
export class SchoolExternalToolRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName(): EntityName<SchoolExternalToolEntity> {
		return SchoolExternalToolEntity;
	}

	public async createOrUpdate(domainObject: SchoolExternalTool): Promise<SchoolExternalTool> {
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

		const savedDomainObject: SchoolExternalTool = this.mapEntityToDomainObject(entity);

		return savedDomainObject;
	}

	public async findById(id: EntityId): Promise<SchoolExternalTool> {
		const entity: SchoolExternalToolEntity = await this.em.findOneOrFail(this.entityName, { id });
		const domainObject: SchoolExternalTool = this.mapEntityToDomainObject(entity);

		return domainObject;
	}

	public deleteById(id: EntityId): void {
		this.em.remove(this.em.getReference(this.entityName, id));
	}

	async findByExternalToolId(toolId: string): Promise<SchoolExternalTool[]> {
		const entities: SchoolExternalToolEntity[] = await this.em.find(this.entityName, { tool: toolId });
		const domainObjects: SchoolExternalTool[] = entities.map((entity: SchoolExternalToolEntity): SchoolExternalTool => {
			const domainObject: SchoolExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		});
		return domainObjects;
	}

	async findBySchoolId(schoolId: string): Promise<SchoolExternalTool[]> {
		const entities: SchoolExternalToolEntity[] = await this.em.find(this.entityName, { school: schoolId });
		const domainObjects: SchoolExternalTool[] = entities.map((entity: SchoolExternalToolEntity): SchoolExternalTool => {
			const domainObject: SchoolExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		});

		return domainObjects;
	}

	async deleteByExternalToolId(toolId: string): Promise<number> {
		const count: Promise<number> = this.em.nativeDelete(this.entityName, { tool: toolId });
		return count;
	}

	async find(query: SchoolExternalToolQuery): Promise<SchoolExternalTool[]> {
		const scope: SchoolExternalToolScope = this.buildScope(query);

		const entities: SchoolExternalToolEntity[] = await this.em.find(this.entityName, scope.query);

		const dos: SchoolExternalTool[] = entities.map((entity: SchoolExternalToolEntity) =>
			this.mapEntityToDomainObject(entity)
		);
		return dos;
	}

	private buildScope(query: SchoolExternalToolQuery): SchoolExternalToolScope {
		const scope: SchoolExternalToolScope = new SchoolExternalToolScope();

		scope.bySchoolId(query.schoolId);
		scope.byToolId(query.toolId);
		scope.byIsDeactivated(query.isDeactivated);
		scope.allowEmptyQuery(true);

		return scope;
	}

	mapEntityToDomainObject(entity: SchoolExternalToolEntity): SchoolExternalTool {
		return new SchoolExternalTool({
			id: entity.id,
			toolId: entity.tool.id,
			schoolId: entity.school.id,
			parameters: ExternalToolRepoMapper.mapCustomParameterEntryEntitiesToDOs(entity.schoolParameters),
			status: entity.status,
		});
	}

	private mapDomainObjectToEntityProps(entityDO: SchoolExternalTool): SchoolExternalToolEntityProps {
		return {
			school: this.em.getReference(SchoolEntity, entityDO.schoolId),
			tool: this.em.getReference(ExternalToolEntity, entityDO.toolId),
			schoolParameters: ExternalToolRepoMapper.mapCustomParameterEntryDOsToEntities(entityDO.parameters),
			status: entityDO.status,
		};
	}
}
