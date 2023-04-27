import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Course, CourseExternalTool, ICourseExternalToolProperties, SchoolExternalTool } from '@shared/domain';
import { CourseExternalToolDO } from '@shared/domain/domainobject/external-tool/course-external-tool.do';
import { BaseDORepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { CourseExternalToolQuery } from '@src/modules/tool/uc/dto/course-external-tool.types';
import { ExternalToolRepoMapper } from '../externaltool/external-tool.repo.mapper';
import { CourseExternalToolScope } from './course-external-tool.scope';

@Injectable()
export class CourseExternalToolRepo extends BaseDORepo<
	CourseExternalToolDO,
	CourseExternalTool,
	ICourseExternalToolProperties
> {
	constructor(
		private readonly externalToolRepoMapper: ExternalToolRepoMapper,
		protected readonly _em: EntityManager,
		protected readonly logger: Logger
	) {
		super(_em, logger);
	}

	get entityName(): EntityName<CourseExternalTool> {
		return CourseExternalTool;
	}

	entityFactory(props: ICourseExternalToolProperties): CourseExternalTool {
		return new CourseExternalTool(props);
	}

	async deleteBySchoolExternalToolIds(schoolExternalToolIds: string[]): Promise<number> {
		const count: Promise<number> = this._em.nativeDelete(this.entityName, {
			schoolTool: { $in: schoolExternalToolIds },
		});
		return count;
	}

	async find(query: CourseExternalToolQuery): Promise<CourseExternalToolDO[]> {
		const scope: CourseExternalToolScope = this.buildScope(query);

		const entities: CourseExternalTool[] = await this._em.find(this.entityName, scope.query);

		const dos: CourseExternalToolDO[] = entities.map((entity: CourseExternalTool) => this.mapEntityToDO(entity));
		return dos;
	}

	private buildScope(query: CourseExternalToolQuery): CourseExternalToolScope {
		const scope: CourseExternalToolScope = new CourseExternalToolScope();
		if (query.schoolToolId) {
			scope.bySchoolToolId(query.schoolToolId);
		}
		scope.allowEmptyQuery(true);
		return scope;
	}

	mapEntityToDO(entity: CourseExternalTool): CourseExternalToolDO {
		return new CourseExternalToolDO({
			id: entity.id,
			displayName: entity.displayName,
			schoolToolId: entity.schoolTool.id,
			courseId: entity.course.id,
			toolVersion: entity.toolVersion,
			parameters: this.externalToolRepoMapper.mapCustomParameterEntryEntitiesToDOs(entity.courseParameters),
		});
	}

	mapDOToEntityProperties(entityDO: CourseExternalToolDO): ICourseExternalToolProperties {
		return {
			displayName: entityDO.displayName,
			course: this._em.getReference(Course, entityDO.courseId),
			schoolTool: this._em.getReference(SchoolExternalTool, entityDO.schoolToolId),
			toolVersion: entityDO.toolVersion,
			courseParameters: this.externalToolRepoMapper.mapCustomParameterEntryDOsToEntities(entityDO.parameters),
		};
	}
}
