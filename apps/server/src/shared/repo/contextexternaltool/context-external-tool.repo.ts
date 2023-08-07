import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseDORepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { ContextExternalToolQuery } from '@src/modules/tool/context-external-tool/uc/dto/context-external-tool.types';
import { SchoolExternalToolEntity } from '@src/modules/tool/school-external-tool/entity';
import {
	ContextExternalToolEntity,
	ContextExternalToolType,
	IContextExternalToolProperties,
} from '@src/modules/tool/context-external-tool/entity';
import { ToolContextType } from '@src/modules/tool/common/enum/tool-context-type.enum';
import { ContextExternalTool, ContextRef } from '@src/modules/tool/context-external-tool/domain';
import { SchoolExternalToolRefDO } from '@src/modules/tool/school-external-tool/domain';
import { ExternalToolRepoMapper } from '../externaltool';
import { ContextExternalToolScope } from './context-external-tool.scope';

@Injectable()
export class ContextExternalToolRepo extends BaseDORepo<
	ContextExternalTool,
	ContextExternalToolEntity,
	IContextExternalToolProperties
> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {
		super(_em, logger);
	}

	get entityName(): EntityName<ContextExternalToolEntity> {
		return ContextExternalToolEntity;
	}

	entityFactory(props: IContextExternalToolProperties): ContextExternalToolEntity {
		return new ContextExternalToolEntity(props);
	}

	async deleteBySchoolExternalToolIds(schoolExternalToolIds: string[]): Promise<number> {
		const count: Promise<number> = this._em.nativeDelete(this.entityName, {
			schoolTool: { $in: schoolExternalToolIds },
		});
		return count;
	}

	async find(query: ContextExternalToolQuery): Promise<ContextExternalTool[]> {
		const scope: ContextExternalToolScope = this.buildScope(query);

		const entities: ContextExternalToolEntity[] = await this._em.find(this.entityName, scope.query, {
			populate: ['schoolTool.school'],
		});

		const dos: ContextExternalTool[] = entities.map((entity: ContextExternalToolEntity) => this.mapEntityToDO(entity));
		return dos;
	}

	async findByIdAndContext(query: ContextExternalToolQuery): Promise<ContextExternalTool> {
		const scope = this.buildScope(query);

		const tool = await this._em.findOneOrFail(this.entityName, scope.query);

		return this.mapEntityToDO(tool);
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

	mapEntityToDO(entity: ContextExternalToolEntity): ContextExternalTool {
		const schoolToolRef: SchoolExternalToolRefDO = new SchoolExternalToolRefDO({
			schoolId: entity.schoolTool.school?.id,
			schoolToolId: entity.schoolTool.id,
		});

		const contextRef: ContextRef = new ContextRef({
			id: entity.contextId,
			type: this.mapContextTypeToDoType(entity.contextType),
		});

		return new ContextExternalTool({
			id: entity.id,
			schoolToolRef,
			contextRef,
			displayName: entity.displayName,
			toolVersion: entity.toolVersion,
			parameters: ExternalToolRepoMapper.mapCustomParameterEntryEntitiesToDOs(entity.parameters),
		});
	}

	mapDOToEntityProperties(entityDO: ContextExternalTool): IContextExternalToolProperties {
		return {
			contextId: entityDO.contextRef.id,
			contextType: this.mapContextTypeToEntityType(entityDO.contextRef.type),
			displayName: entityDO.displayName,
			schoolTool: this._em.getReference(SchoolExternalToolEntity, entityDO.schoolToolRef.schoolToolId),
			toolVersion: entityDO.toolVersion,
			parameters: ExternalToolRepoMapper.mapCustomParameterEntryDOsToEntities(entityDO.parameters),
		};
	}

	private mapContextTypeToEntityType(type: ToolContextType): ContextExternalToolType {
		switch (type) {
			case ToolContextType.COURSE:
				return ContextExternalToolType.COURSE;
			default:
				throw new Error('Unknown ToolContextType');
		}
	}

	private mapContextTypeToDoType(type: ContextExternalToolType): ToolContextType {
		switch (type) {
			case ContextExternalToolType.COURSE:
				return ToolContextType.COURSE;
			default:
				throw new Error('Unknown ContextExternalToolType');
		}
	}
}
