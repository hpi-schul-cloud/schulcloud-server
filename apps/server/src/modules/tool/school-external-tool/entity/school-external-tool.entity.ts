import { Embedded, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { CustomParameterEntryEntity } from '../../common/entity';
import { ExternalToolEntity } from '../../external-tool/entity';
import { SchoolExternalToolConfigurationStatusEntity } from './SchoolExternalToolConfigurationStatusEntity';

export interface SchoolExternalToolProperties {
	tool: ExternalToolEntity;
	school: SchoolEntity;
	schoolParameters?: CustomParameterEntryEntity[];
	toolVersion: number;
	status?: SchoolExternalToolConfigurationStatusEntity;
}

@Entity({ tableName: 'school-external-tools' })
export class SchoolExternalToolEntity extends BaseEntityWithTimestamps {
	@ManyToOne()
	tool: ExternalToolEntity;

	@ManyToOne(() => SchoolEntity, { eager: true })
	school: SchoolEntity;

	@Embedded(() => CustomParameterEntryEntity, { array: true })
	schoolParameters: CustomParameterEntryEntity[];

	@Property()
	toolVersion: number;

	@Property()
	status?: SchoolExternalToolConfigurationStatusEntity;

	constructor(props: SchoolExternalToolProperties) {
		super();
		this.tool = props.tool;
		this.school = props.school;
		this.schoolParameters = props.schoolParameters ?? [];
		this.toolVersion = props.toolVersion;
		this.status = props.status;
	}
}
