import { BaseDORepo, EntityProperties } from '@shared/repo';
import { EntityName, Reference } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Course, CourseExternalTool, ICourseExternalToolProperties, SchoolExternalTool } from '@shared/domain';
import { EntityManager } from '@mikro-orm/mongodb';
import { CourseExternalToolDO } from '../../domain/domainobject/external-tool/course-external-tool.do';
import { ExternalToolRepoMapper } from '../externaltool/external-tool.repo.mapper';
import { Logger } from '../../../core/logger';

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

	mapEntityToDO(entity: CourseExternalTool): CourseExternalToolDO {
		return new CourseExternalToolDO({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			schoolToolId: entity.schoolTool.id,
			courseId: entity.course.id,
			toolVersion: entity.toolVersion,
			parameters: this.externalToolRepoMapper.mapCustomParameterEntryEntitiesToDOs(entity.courseParameters),
		});
	}

	mapDOToEntityProperties(entityDO: CourseExternalToolDO): EntityProperties<ICourseExternalToolProperties> {
		return {
			id: entityDO.id,
			course: Reference.createFromPK(Course, entityDO.courseId),
			schoolTool: Reference.createFromPK(SchoolExternalTool, entityDO.schoolToolId),
			toolVersion: entityDO.toolVersion,
			courseParameters: this.externalToolRepoMapper.mapCustomParameterEntryDOsToEntities(entityDO.parameters),
		};
	}
}
