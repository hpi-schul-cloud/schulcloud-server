import { Embedded, Entity, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { SchoolEntity } from '@modules/school/repo';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { CustomParameterEntryEntity } from '../../../common/entity';
import { ExternalToolEntity } from '../../../external-tool/repo';

export interface SchoolExternalToolEntityProps {
	id?: EntityId;

	tool: ExternalToolEntity;

	school: SchoolEntity;

	schoolParameters?: CustomParameterEntryEntity[];

	isDeactivated: boolean;
}

@Entity({ tableName: 'school-external-tools' })
@Unique({ properties: ['tool', 'school'] })
export class SchoolExternalToolEntity extends BaseEntityWithTimestamps {
	@ManyToOne()
	tool: ExternalToolEntity;

	@ManyToOne(() => SchoolEntity, { eager: true })
	school: SchoolEntity;

	@Embedded(() => CustomParameterEntryEntity, { array: true })
	schoolParameters: CustomParameterEntryEntity[];

	@Property()
	isDeactivated: boolean;

	constructor(props: SchoolExternalToolEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.tool = props.tool;
		this.school = props.school;
		this.schoolParameters = props.schoolParameters ?? [];
		this.isDeactivated = props.isDeactivated;
	}
}
