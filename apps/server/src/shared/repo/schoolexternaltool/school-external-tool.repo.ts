import { BaseDORepo, EntityProperties } from '@shared/repo';
import { EntityName, Reference } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ExternalTool, ISchoolExternalToolProperties, School, SchoolExternalTool } from '@shared/domain';
import { EntityManager } from '@mikro-orm/mongodb';
import { SchoolExternalToolDO } from '../../domain/domainobject/external-tool/school-external-tool.do';
import { ExternalToolRepoMapper } from '../externaltool/external-tool.repo.mapper';
import { Logger } from '../../../core/logger';
import { SchoolExternalToolScope } from './school-external-tool.scope';
import { SchoolExternalToolQuery } from '../../../modules/tool/uc/dto/school-external-tool.types';

@Injectable()
export class SchoolExternalToolRepo extends BaseDORepo<
	SchoolExternalToolDO,
	SchoolExternalTool,
	ISchoolExternalToolProperties
> {
	constructor(
		private readonly externalToolRepoMapper: ExternalToolRepoMapper,
		protected readonly _em: EntityManager,
		protected readonly logger: Logger
	) {
		super(_em, logger);
	}

	get entityName(): EntityName<SchoolExternalTool> {
		return SchoolExternalTool;
	}

	entityFactory(props: ISchoolExternalToolProperties): SchoolExternalTool {
		return new SchoolExternalTool(props);
	}

	async findByExternalToolId(toolId: string): Promise<SchoolExternalToolDO[]> {
		const entities: SchoolExternalTool[] = await this._em.find(this.entityName, { tool: toolId });
		const domainObjects: SchoolExternalToolDO[] = entities.map((entity: SchoolExternalTool): SchoolExternalToolDO => {
			const domainObject: SchoolExternalToolDO = this.mapEntityToDO(entity);
			return domainObject;
		});
		return domainObjects;
	}

	async deleteByExternalToolId(toolId: string): Promise<number> {
		const count: Promise<number> = this._em.nativeDelete(this.entityName, { tool: toolId });
		return count;
	}

	async find(query: SchoolExternalToolQuery): Promise<SchoolExternalToolDO[]> {
		const scope: SchoolExternalToolScope = this.buildScope(query);

		const entities: SchoolExternalTool[] = await this._em.find(this.entityName, scope.query);

		const dos: SchoolExternalToolDO[] = entities.map((entity: SchoolExternalTool) => this.mapEntityToDO(entity));
		return dos;
	}

	private buildScope(query: SchoolExternalToolQuery): SchoolExternalToolScope {
		const scope: SchoolExternalToolScope = new SchoolExternalToolScope();
		if (query.schoolId) {
			scope.bySchoolId(query.schoolId);
		}
		scope.allowEmptyQuery(true);
		return scope;
	}

	mapEntityToDO(entity: SchoolExternalTool): SchoolExternalToolDO {
		return new SchoolExternalToolDO({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			toolId: entity.tool.id,
			schoolId: entity.school.id,
			toolVersion: entity.toolVersion,
			parameters: this.externalToolRepoMapper.mapCustomParameterEntryEntitiesToDOs(entity.schoolParameters),
		});
	}

	mapDOToEntityProperties(entityDO: SchoolExternalToolDO): EntityProperties<ISchoolExternalToolProperties> {
		return {
			id: entityDO.id,
			school: Reference.createFromPK(School, entityDO.schoolId),
			tool: Reference.createFromPK(ExternalTool, entityDO.toolId),
			toolVersion: entityDO.toolVersion,
			schoolParameters: this.externalToolRepoMapper.mapCustomParameterEntryDOsToEntities(entityDO.parameters),
		};
	}
}
