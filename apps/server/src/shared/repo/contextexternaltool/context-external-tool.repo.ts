import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import {
	ContextExternalTool,
	ContextExternalToolDO,
	ContextRef,
	IContextExternalToolProperties,
	SchoolExternalTool,
} from '@shared/domain';
import { ContextExternalToolType } from '@shared/domain/entity/tools/course-external-tool/context-external-tool-type.enum';
import { BaseDORepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { ToolContextType } from '@src/modules/tool/interface';
import { ContextExternalToolQuery } from '@src/modules/tool/uc/dto';
import { SchoolExternalToolRefDO } from '../../domain';
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
		scope.byContextId(query.context?.id);
		scope.byContextType(query.context?.type);
		scope.allowEmptyQuery(true);

		return scope;
	}

	mapEntityToDO(entity: ContextExternalTool): ContextExternalToolDO {
		const schoolToolRef: SchoolExternalToolRefDO = new SchoolExternalToolRefDO({
			schoolId: entity.schoolTool.school?.id,
			schoolToolId: entity.schoolTool.id,
		});

		const contextRef: ContextRef = new ContextRef({
			id: entity.contextId,
			type: this.mapContextTypeToDoType(entity.contextType),
		});

		return new ContextExternalToolDO({
			id: entity.id,
			schoolToolRef,
			contextRef,
			displayName: entity.displayName,
			toolVersion: entity.toolVersion,
			parameters: this.externalToolRepoMapper.mapCustomParameterEntryEntitiesToDOs(entity.parameters),
		});
	}

	mapDOToEntityProperties(entityDO: ContextExternalToolDO): IContextExternalToolProperties {
		return {
			contextId: entityDO.contextRef.id,
			contextType: this.mapContextTypeToEntityType(entityDO.contextRef.type),
			displayName: entityDO.displayName,
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
