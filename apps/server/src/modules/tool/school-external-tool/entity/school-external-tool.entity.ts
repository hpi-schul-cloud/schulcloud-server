import { Embedded, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { School } from '@shared/domain/entity/school.entity';
import { CustomParameterEntry } from '../../common/entity';
import { ExternalToolEntity } from '../../external-tool/entity';

export interface ISchoolExternalToolProperties {
	tool: ExternalToolEntity;
	school: School;
	schoolParameters?: CustomParameterEntry[];
	toolVersion: number;
}

@Entity({ tableName: 'school_external_tools' })
export class SchoolExternalToolEntity extends BaseEntityWithTimestamps {
	@ManyToOne()
	tool: ExternalToolEntity;

	@ManyToOne(() => School, { eager: true })
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
