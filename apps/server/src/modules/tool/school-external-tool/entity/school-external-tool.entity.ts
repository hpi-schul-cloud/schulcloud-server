import { Embedded, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { CustomParameterEntryEntity } from '../../common/entity';
import { ExternalToolEntity } from '../../external-tool/entity';

export interface ISchoolExternalToolProperties {
	tool: ExternalToolEntity;
	school: SchoolEntity;
	schoolParameters?: CustomParameterEntryEntity[];
	toolVersion: number;
}

@Entity({ tableName: 'school_external_tools' })
export class SchoolExternalToolEntity extends BaseEntityWithTimestamps {
	@ManyToOne()
	tool: ExternalToolEntity;

	@ManyToOne(() => SchoolEntity, { eager: true })
	school: SchoolEntity;

	@Embedded(() => CustomParameterEntryEntity, { array: true })
	schoolParameters: CustomParameterEntryEntity[];

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
