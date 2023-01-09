import { BaseDORepo } from '@shared/repo';
import { EntityName, Reference } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Course, CourseExternalTool, ICourseExternalToolProperties, SchoolExternalTool } from '@shared/domain';
import { EntityManager } from '@mikro-orm/mongodb';
import { Logger } from '@src/core/logger';
import { CourseExternalToolQuery } from '@src/modules/tool/uc/dto/course-external-tool.types';
import { CourseExternalToolDO } from '@shared/domain/domainobject/external-tool/course-external-tool.do';
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

	async delete(courseExternalTools: CourseExternalToolDO[] | CourseExternalToolDO): Promise<void> {
		const tools: CourseExternalToolDO[] = Array.isArray(courseExternalTools)
			? courseExternalTools
			: [courseExternalTools];

		const entities: CourseExternalTool[] = tools.map(
			(domainObj: CourseExternalToolDO): CourseExternalTool => this.createNewEntityFromDO(domainObj)
		);

		this._em.remove(entities);
		await this._em.flush();
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
			course: Reference.createFromPK(Course, entityDO.courseId),
			schoolTool: Reference.createFromPK(SchoolExternalTool, entityDO.schoolToolId),
			toolVersion: entityDO.toolVersion,
			courseParameters: this.externalToolRepoMapper.mapCustomParameterEntryDOsToEntities(entityDO.parameters),
		};
	}
}
