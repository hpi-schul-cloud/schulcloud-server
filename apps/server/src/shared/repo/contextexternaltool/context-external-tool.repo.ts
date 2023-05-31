import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import {
	ContextExternalTool,
	ContextExternalToolDO,
	IContextExternalToolProperties,
	SchoolExternalTool,
} from '@shared/domain';
import { BaseDORepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { ContextExternalToolType } from '@shared/domain/entity/tools/course-external-tool/context-external-tool-type.enum';
import { ToolContextType } from '@src/modules/tool/interface';
import { ContextExternalToolQuery } from '@src/modules/tool/uc/dto';
import { ExternalToolRepoMapper } from '../externaltool';
import { ContextExternalToolScope } from './context-external-tool.scope';
import { SchoolExternalToolRefDO } from '../../domain';

@Injectable()
export class ContextExternalToolRepo extends BaseDORepo<
	ContextExternalToolDO,
	ContextExternalTool,
	IContextExternalToolProperties
> {
	constructor(
		private readonly externalToolRepoMapper: ExternalToolRepoMapper,
		protected readonly _em: EntityManager,
		protected readonly logger: LegacyLogger
	) {
		super(_em, logger);
	}

	get entityName(): EntityName<ContextExternalTool> {
		return ContextExternalTool;
	}

	entityFactory(props: IContextExternalToolProperties): ContextExternalTool {
		return new ContextExternalTool(props);
	}

	async deleteBySchoolExternalToolIds(schoolExternalToolIds: string[]): Promise<number> {
		const count: Promise<number> = this._em.nativeDelete(this.entityName, {
			schoolTool: { $in: schoolExternalToolIds },
		});
		return count;
	}

	async find(query: ContextExternalToolQuery): Promise<ContextExternalToolDO[]> {
		const scope: ContextExternalToolScope = this.buildScope(query);

		const entities: ContextExternalTool[] = await this._em.find(this.entityName, scope.query, {
			populate: ['schoolTool.school'],
		});

		const dos: ContextExternalToolDO[] = entities.map((entity: ContextExternalTool) => this.mapEntityToDO(entity));
		return dos;
	}

	private buildScope(query: ContextExternalToolQuery): ContextExternalToolScope {
		const scope: ContextExternalToolScope = new ContextExternalToolScope();

		scope.byId(query.id);
		scope.bySchoolToolId(query.schoolToolRef?.schoolToolId);
		scope.byContextId(query.contextId);

		scope.allowEmptyQuery(true);

		return scope;
	}

	mapEntityToDO(entity: ContextExternalTool): ContextExternalToolDO {
		const schoolToolRef: SchoolExternalToolRefDO = new SchoolExternalToolRefDO({
			schoolId: entity.schoolTool.school?.id,
			schoolToolId: entity.schoolTool.id,
		});

		return new ContextExternalToolDO({
			id: entity.id,
			schoolToolRef,
			contextId: entity.contextId,
			contextType: this.mapContextTypeToDoType(entity.contextType),
			contextToolName: entity.contextToolName,
			toolVersion: entity.toolVersion,
			parameters: this.externalToolRepoMapper.mapCustomParameterEntryEntitiesToDOs(entity.parameters),
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});
	}

	mapDOToEntityProperties(entityDO: ContextExternalToolDO): IContextExternalToolProperties {
		return {
			contextId: entityDO.contextId,
			contextType: this.mapContextTypeToEntityType(entityDO.contextType),
			contextToolName: entityDO.contextToolName,
			schoolTool: this._em.getReference(SchoolExternalTool, entityDO.schoolToolRef.schoolToolId),
			toolVersion: entityDO.toolVersion,
			parameters: this.externalToolRepoMapper.mapCustomParameterEntryDOsToEntities(entityDO.parameters),
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
