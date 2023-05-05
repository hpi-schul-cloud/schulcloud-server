import { Embedded, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '../../base.entity';
import { Course } from '../../course.entity';
import { CustomParameterEntry } from '../custom-parameter-entry';
import { SchoolExternalTool } from '../school-external-tool/school-external-tool.entity';

export interface ICourseExternalToolProperties {
	displayName?: string;

	schoolTool: SchoolExternalTool;

	course: Course;

	courseParameters?: CustomParameterEntry[];

	toolVersion: number;
}

@Entity({ tableName: 'course_external_tools' })
export class CourseExternalTool extends BaseEntityWithTimestamps {
	@Property({ nullable: true })
	displayName?: string;

	@ManyToOne()
	schoolTool: SchoolExternalTool;

	@ManyToOne()
	course: Course;

	@Embedded(() => CustomParameterEntry, { array: true })
	courseParameters: CustomParameterEntry[];

	@Property()
	toolVersion: number;

	constructor(props: ICourseExternalToolProperties) {
		super();
		this.displayName = props.displayName;
		this.schoolTool = props.schoolTool;
		this.course = props.course;
		this.courseParameters = props.courseParameters ?? [];
		this.toolVersion = props.toolVersion;
	}
}
