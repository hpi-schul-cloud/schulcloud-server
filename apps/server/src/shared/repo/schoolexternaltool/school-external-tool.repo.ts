import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import {
	ExternalTool,
	ISchoolExternalToolProperties,
	School,
	SchoolExternalTool,
	SchoolExternalToolDO,
} from '@shared/domain';
import { BaseDORepo } from '@shared/repo/base.do.repo';
import { LegacyLogger } from '@src/core/logger';
import { SchoolExternalToolQuery } from '@src/modules/tool/school-external-tool/uc/dto/school-external-tool.types';
import { SchoolExternalToolScope } from './school-external-tool.scope';
import { ExternalToolRepoMapper } from '../externaltool';

@Injectable()
export class SchoolExternalToolRepo extends BaseDORepo<
	SchoolExternalToolDO,
	SchoolExternalTool,
	ISchoolExternalToolProperties
> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {
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

	async findBySchoolId(schoolId: string): Promise<SchoolExternalToolDO[]> {
		const entities: SchoolExternalTool[] = await this._em.find(this.entityName, { school: schoolId });
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

		scope.bySchoolId(query.schoolId);
		scope.byToolId(query.toolId);
		scope.allowEmptyQuery(true);

		return scope;
	}

	mapEntityToDO(entity: SchoolExternalTool): SchoolExternalToolDO {
		return new SchoolExternalToolDO({
			id: entity.id,
			toolId: entity.tool.id,
			schoolId: entity.school.id,
			toolVersion: entity.toolVersion,
			parameters: ExternalToolRepoMapper.mapCustomParameterEntryEntitiesToDOs(entity.schoolParameters),
		});
	}

	mapDOToEntityProperties(entityDO: SchoolExternalToolDO): ISchoolExternalToolProperties {
		return {
			school: this._em.getReference(School, entityDO.schoolId),
			tool: this._em.getReference(ExternalTool, entityDO.toolId),
			toolVersion: entityDO.toolVersion,
			schoolParameters: ExternalToolRepoMapper.mapCustomParameterEntryDOsToEntities(entityDO.parameters),
		};
	}
}
