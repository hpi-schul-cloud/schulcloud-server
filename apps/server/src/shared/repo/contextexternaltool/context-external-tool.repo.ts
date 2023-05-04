import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import {
	ContextExternalTool,
	IContextExternalToolProperties,
	SchoolExternalTool,
	ContextExternalToolDO,
} from '@shared/domain';
import { BaseDORepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { ContextExternalToolType } from '@shared/domain/entity/tools/course-external-tool/context-external-tool-type.enum';
import { ToolContextType } from '@src/modules/tool/interface';
import { ContextExternalToolQuery } from '@src/modules/tool/uc/dto';
import { ExternalToolRepoMapper } from '../externaltool';
import { ContextExternalToolScope } from './context-external-tool.scope';

@Injectable()
export class ContextExternalToolRepo extends BaseDORepo<
	ContextExternalToolDO,
	ContextExternalTool,
	IContextExternalToolProperties
> {
	constructor(
		private readonly externalToolRepoMapper: ExternalToolRepoMapper,
		protected readonly _em: EntityManager,
		protected readonly logger: Logger
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

		const entities: ContextExternalTool[] = await this._em.find(this.entityName, scope.query);

		const dos: ContextExternalToolDO[] = entities.map((entity: ContextExternalTool) => this.mapEntityToDO(entity));
		return dos;
	}

	private buildScope(query: ContextExternalToolQuery): ContextExternalToolScope {
		const scope: ContextExternalToolScope = new ContextExternalToolScope();

		if (query.contextId && query.schoolToolId) {
			scope.byContextIdAndSchoolToolId(query.contextId, query.schoolToolId);
		} else if (query.schoolToolId) {
			scope.bySchoolToolId(query.schoolToolId);
		}

		scope.allowEmptyQuery(true);

		return scope;
	}

	mapEntityToDO(entity: ContextExternalTool): ContextExternalToolDO {
		return new ContextExternalToolDO({
			id: entity.id,
			schoolToolId: entity.schoolTool.id,
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
			schoolTool: this._em.getReference(SchoolExternalTool, entityDO.schoolToolId),
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
