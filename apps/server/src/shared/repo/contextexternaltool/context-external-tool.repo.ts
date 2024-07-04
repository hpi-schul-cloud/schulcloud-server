import { EntityName, Primary, Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ToolContextType } from '@modules/tool/common/enum/tool-context-type.enum';
import { ContextExternalTool, ContextRef } from '@modules/tool/context-external-tool/domain';
import {
	ContextExternalToolEntity,
	ContextExternalToolEntityProps,
	ContextExternalToolType,
} from '@modules/tool/context-external-tool/entity';
import { ContextExternalToolQuery } from '@modules/tool/context-external-tool/uc/dto/context-external-tool.types';
import { SchoolExternalToolRef } from '@modules/tool/school-external-tool/domain';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ExternalToolRepoMapper } from '../externaltool';
import { ContextExternalToolScope } from './context-external-tool.scope';

@Injectable()
export class ContextExternalToolRepo {
	constructor(protected readonly em: EntityManager) {}

	get entityName(): EntityName<ContextExternalToolEntity> {
		return ContextExternalToolEntity;
	}

	public async deleteBySchoolExternalToolIds(schoolExternalToolIds: string[]): Promise<number> {
		const count: Promise<number> = this.em.nativeDelete(this.entityName, {
			schoolTool: { $in: schoolExternalToolIds },
		});
		return count;
	}

	public async save(domainObject: ContextExternalTool): Promise<ContextExternalTool> {
		const existing: ContextExternalToolEntity | null = await this.em.findOne<ContextExternalToolEntity>(
			ContextExternalToolEntity.name,
			domainObject.id
		);

		const entityProps: ContextExternalToolEntityProps = this.mapDomainObjectToEntityProps(domainObject);
		let entity: ContextExternalToolEntity = new ContextExternalToolEntity(entityProps);

		if (existing) {
			entity = this.em.assign(existing, entity);
		} else {
			this.em.persist(entity);
		}
		await this.em.flush();

		const savedDomainObject: ContextExternalTool = this.mapEntityToDomainObject(entity);

		return savedDomainObject;
	}

	public async delete(domainObjects: ContextExternalTool | ContextExternalTool[]): Promise<void> {
		const ids: Primary<ContextExternalTool>[] = Utils.asArray(domainObjects).map((dob) => dob.id);

		const entities: ContextExternalToolEntity[] = ids.map((id) => this.em.getReference(this.entityName, id));

		await this.em.remove(entities).flush();
	}

	public async find(query: ContextExternalToolQuery): Promise<ContextExternalTool[]> {
		const scope: ContextExternalToolScope = this.buildScope(query);

		const entities: ContextExternalToolEntity[] = await this.em.find(this.entityName, scope.query, {
			populate: ['schoolTool.school'],
		});

		const dos: ContextExternalTool[] = entities.map((entity: ContextExternalToolEntity) =>
			this.mapEntityToDomainObject(entity)
		);
		return dos;
	}

	public async findBySchoolToolIdsAndContextType(
		schoolExternalToolIds: string[],
		contextType: ContextExternalToolType
	): Promise<ContextExternalTool[]> {
		const entities = await this.em.find(this.entityName, { schoolTool: { $in: schoolExternalToolIds }, contextType });

		const dos: ContextExternalTool[] = entities.map((entity: ContextExternalToolEntity) =>
			this.mapEntityToDomainObject(entity)
		);

		return dos;
	}

	public async findById(id: EntityId): Promise<ContextExternalTool> {
		const entity: ContextExternalToolEntity = await this.em.findOneOrFail(
			this.entityName,
			{ id },
			{
				populate: ['schoolTool.school'],
			}
		);

		const mapped: ContextExternalTool = this.mapEntityToDomainObject(entity);

		return mapped;
	}

	public async findByIdOrNull(id: EntityId): Promise<ContextExternalTool | null> {
		const entity: ContextExternalToolEntity | null = await this.em.findOne(
			this.entityName,
			{ id },
			{
				populate: ['schoolTool.school'],
			}
		);

		if (!entity) {
			return null;
		}

		const mapped: ContextExternalTool = this.mapEntityToDomainObject(entity);

		return mapped;
	}

	private buildScope(query: ContextExternalToolQuery): ContextExternalToolScope {
		const scope: ContextExternalToolScope = new ContextExternalToolScope();

		scope.byId(query.id);
		scope.bySchoolToolId(query.schoolToolRef?.schoolToolId);
		scope.byContextId(query.context?.id);
		scope.byContextType(query.context?.type);
		scope.allowEmptyQuery(true);

		return scope;
	}

	private mapEntityToDomainObject(entity: ContextExternalToolEntity): ContextExternalTool {
		const schoolToolRef: SchoolExternalToolRef = new SchoolExternalToolRef({
			schoolId: entity.schoolTool.school?.id,
			schoolToolId: entity.schoolTool.id,
		});

		const contextRef: ContextRef = new ContextRef({
			id: entity.contextId,
			type: this.mapContextTypeToDomainObjectType(entity.contextType),
		});

		return new ContextExternalTool({
			id: entity.id,
			schoolToolRef,
			contextRef,
			displayName: entity.displayName,
			parameters: ExternalToolRepoMapper.mapCustomParameterEntryEntitiesToDOs(entity.parameters),
		});
	}

	private mapDomainObjectToEntityProps(entityDO: ContextExternalTool): ContextExternalToolEntityProps {
		return {
			contextId: entityDO.contextRef.id,
			contextType: this.mapContextTypeToEntityType(entityDO.contextRef.type),
			displayName: entityDO.displayName,
			schoolTool: this.em.getReference(SchoolExternalToolEntity, entityDO.schoolToolRef.schoolToolId),
			parameters: ExternalToolRepoMapper.mapCustomParameterEntryDOsToEntities(entityDO.parameters),
		};
	}

	private mapContextTypeToEntityType(type: ToolContextType): ContextExternalToolType {
		switch (type) {
			case ToolContextType.COURSE:
				return ContextExternalToolType.COURSE;
			case ToolContextType.BOARD_ELEMENT:
				return ContextExternalToolType.BOARD_ELEMENT;
			case ToolContextType.MEDIA_BOARD:
				return ContextExternalToolType.MEDIA_BOARD;
			default:
				throw new Error('Unknown ToolContextType');
		}
	}

	private mapContextTypeToDomainObjectType(type: ContextExternalToolType): ToolContextType {
		switch (type) {
			case ContextExternalToolType.COURSE:
				return ToolContextType.COURSE;
			case ContextExternalToolType.BOARD_ELEMENT:
				return ToolContextType.BOARD_ELEMENT;
			case ContextExternalToolType.MEDIA_BOARD:
				return ToolContextType.MEDIA_BOARD;
			default:
				throw new Error('Unknown ContextExternalToolType');
		}
	}
}
