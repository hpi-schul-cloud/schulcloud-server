import { EntityData, EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { SchoolExternalToolQuery } from '@modules/tool/school-external-tool/uc/dto/school-external-tool.types';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { SchoolEntity } from '@shared/domain/entity';
import { BaseDORepo } from '@shared/repo/base.do.repo';
import { LegacyLogger } from '@src/core/logger';
import { ExternalToolRepoMapper } from '../externaltool';
import { SchoolExternalToolScope } from './school-external-tool.scope';

@Injectable()
export class SchoolExternalToolRepo extends BaseDORepo<SchoolExternalTool, SchoolExternalToolEntity> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {
		super(_em, logger);
	}

	get entityName(): EntityName<SchoolExternalToolEntity> {
		return SchoolExternalToolEntity;
	}

	async findByExternalToolId(toolId: string): Promise<SchoolExternalTool[]> {
		const entities: SchoolExternalToolEntity[] = await this._em.find(this.entityName, { tool: toolId });
		const domainObjects: SchoolExternalTool[] = entities.map((entity: SchoolExternalToolEntity): SchoolExternalTool => {
			const domainObject: SchoolExternalTool = this.mapEntityToDO(entity);
			return domainObject;
		});
		return domainObjects;
	}

	async findBySchoolId(schoolId: string): Promise<SchoolExternalTool[]> {
		const entities: SchoolExternalToolEntity[] = await this._em.find(this.entityName, { school: schoolId });
		const domainObjects: SchoolExternalTool[] = entities.map((entity: SchoolExternalToolEntity): SchoolExternalTool => {
			const domainObject: SchoolExternalTool = this.mapEntityToDO(entity);
			return domainObject;
		});

		return domainObjects;
	}

	async deleteByExternalToolId(toolId: string): Promise<number> {
		const count: Promise<number> = this._em.nativeDelete(this.entityName, { tool: toolId });
		return count;
	}

	async find(query: SchoolExternalToolQuery): Promise<SchoolExternalTool[]> {
		const scope: SchoolExternalToolScope = this.buildScope(query);

		const entities: SchoolExternalToolEntity[] = await this._em.find(this.entityName, scope.query);

		const dos: SchoolExternalTool[] = entities.map((entity: SchoolExternalToolEntity) => this.mapEntityToDO(entity));
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

	mapEntityToDO(entity: SchoolExternalToolEntity): SchoolExternalTool {
		return new SchoolExternalTool({
			id: entity.id,
			toolId: entity.tool.id,
			schoolId: entity.school.id,
			toolVersion: entity.toolVersion,
			parameters: ExternalToolRepoMapper.mapCustomParameterEntryEntitiesToDOs(entity.schoolParameters),
			status: entity.status,
		});
	}

	mapDOToEntityProperties(entityDO: SchoolExternalTool): EntityData<SchoolExternalToolEntity> {
		return {
			school: this._em.getReference(SchoolEntity, entityDO.schoolId),
			tool: this._em.getReference(ExternalToolEntity, entityDO.toolId),
			toolVersion: entityDO.toolVersion,
			schoolParameters: ExternalToolRepoMapper.mapCustomParameterEntryDOsToEntities(entityDO.parameters),
			status: entityDO.status,
		};
	}
}
