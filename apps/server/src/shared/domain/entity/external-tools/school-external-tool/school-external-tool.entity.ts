import { Embedded, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { CustomParameterEntry } from '../custom-parameter-entry';
import { ExternalTool } from '../external-tool/external-tool.entity';
import { BaseEntityWithTimestamps } from '../../base.entity';
import { School } from '../../school.entity';

export interface ISchoolExternalToolProperties {
	tool: ExternalTool;
	school: School;
	schoolParameters?: CustomParameterEntry[];
	toolVersion: number;
}

@Entity({ tableName: 'school_external_tools' })
export class SchoolExternalTool extends BaseEntityWithTimestamps {
	@ManyToOne()
	tool: ExternalTool;

	@ManyToOne()
	school: School;

	@Embedded(() => CustomParameterEntry, { array: true })
	schoolParameters: CustomParameterEntry[];

	@Property()
	toolVersion: number;

	constructor(props: ISchoolExternalToolProperties) {
		super();
		this.tool = props.tool;
		this.school = props.school;
		this.schoolParameters = props.schoolParameters ?? [];
		this.toolVersion = props.toolVersion;
	}
}
