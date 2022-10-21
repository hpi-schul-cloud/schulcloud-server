import { CustomParameterEntry } from '@shared/domain/entity/external-tool/custom-parameter/custom-parameter-entry';
import { Embedded, Entity, OneToMany, Property } from '@mikro-orm/core';
import { SchoolExternalTool } from './school-external-tool.entity';
import { BaseEntityWithTimestamps } from './base.entity';
import { Course } from './course.entity';

export interface ICourseExternalToolProperties {
	schoolTool: SchoolExternalTool;
	course: Course;
	courseParameters?: CustomParameterEntry[];
	toolVersion: number;
}

@Entity({ tableName: 'course_external_tools' })
export class CourseExternalTool extends BaseEntityWithTimestamps {
	@Property()
	schoolTool: SchoolExternalTool;

	@Property()
	course: Course;

	@Embedded(() => CustomParameterEntry, { array: true })
	courseParameters: CustomParameterEntry[];

	@Property()
	toolVersion: number;

	constructor(props: ICourseExternalToolProperties) {
		super();
		this.schoolTool = props.schoolTool;
		this.course = props.course;
		this.courseParameters = props.courseParameters ?? [];
		this.toolVersion = props.toolVersion;
	}
}
