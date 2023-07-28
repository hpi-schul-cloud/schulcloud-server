import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { School } from '@shared/domain';
import { BaseDORepo } from '@shared/repo/base.do.repo';
import { LegacyLogger } from '@src/core/logger';
import { SchoolExternalToolQuery } from '@src/modules/tool/school-external-tool/uc/dto/school-external-tool.types';
import { ISchoolExternalToolProperties, SchoolExternalToolEntity } from '@src/modules/tool/school-external-tool/entity';
import { SchoolExternalToolDO } from '@src/modules/tool/school-external-tool/domain';
import { ExternalToolEntity } from '@src/modules/tool/external-tool/entity';
import { SchoolExternalToolScope } from './school-external-tool.scope';
import { ExternalToolRepoMapper } from '../externaltool';

@Injectable()
export class SchoolExternalToolRepo extends BaseDORepo<
	SchoolExternalToolDO,
	SchoolExternalToolEntity,
	ISchoolExternalToolProperties
> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {
		super(_em, logger);
	}

	get entityName(): EntityName<SchoolExternalToolEntity> {
		return SchoolExternalToolEntity;
	}

	entityFactory(props: ISchoolExternalToolProperties): SchoolExternalToolEntity {
		return new SchoolExternalToolEntity(props);
	}

	async findByExternalToolId(toolId: string): Promise<SchoolExternalToolDO[]> {
		const entities: SchoolExternalToolEntity[] = await this._em.find(this.entityName, { tool: toolId });
		const domainObjects: SchoolExternalToolDO[] = entities.map(
			(entity: SchoolExternalToolEntity): SchoolExternalToolDO => {
				const domainObject: SchoolExternalToolDO = this.mapEntityToDO(entity);
				return domainObject;
			}
		);
		return domainObjects;
	}

	async findBySchoolId(schoolId: string): Promise<SchoolExternalToolDO[]> {
		const entities: SchoolExternalToolEntity[] = await this._em.find(this.entityName, { school: schoolId });
		const domainObjects: SchoolExternalToolDO[] = entities.map(
			(entity: SchoolExternalToolEntity): SchoolExternalToolDO => {
				const domainObject: SchoolExternalToolDO = this.mapEntityToDO(entity);
				return domainObject;
			}
		);
		return domainObjects;
	}

	async deleteByExternalToolId(toolId: string): Promise<number> {
		const count: Promise<number> = this._em.nativeDelete(this.entityName, { tool: toolId });
		return count;
	}

	async find(query: SchoolExternalToolQuery): Promise<SchoolExternalToolDO[]> {
		const scope: SchoolExternalToolScope = this.buildScope(query);

		const entities: SchoolExternalToolEntity[] = await this._em.find(this.entityName, scope.query);

		const dos: SchoolExternalToolDO[] = entities.map((entity: SchoolExternalToolEntity) => this.mapEntityToDO(entity));
		return dos;
	}

	private buildScope(query: SchoolExternalToolQuery): SchoolExternalToolScope {
		const scope: SchoolExternalToolScope = new SchoolExternalToolScope();

		scope.bySchoolId(query.schoolId);
		scope.byToolId(query.toolId);
		scope.allowEmptyQuery(true);

		return scope;
	}

	mapEntityToDO(entity: SchoolExternalToolEntity): SchoolExternalToolDO {
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
			tool: this._em.getReference(ExternalToolEntity, entityDO.toolId),
			toolVersion: entityDO.toolVersion,
			schoolParameters: ExternalToolRepoMapper.mapCustomParameterEntryDOsToEntities(entityDO.parameters),
		};
	}
}
