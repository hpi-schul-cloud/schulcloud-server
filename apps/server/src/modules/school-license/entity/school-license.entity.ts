import { Entity, Enum, Index, ManyToOne } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { SchoolEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { SchoolLicenseType } from '../enum';

export interface SchoolLicenseProps {
	id?: EntityId;
	school: SchoolEntity;
	type: SchoolLicenseType;
}

@Entity({ tableName: 'school-licenses', discriminatorColumn: 'type', abstract: true })
@Index({ properties: ['school', 'type'] })
export abstract class SchoolLicenseEntity extends BaseEntityWithTimestamps {
	protected constructor(props: SchoolLicenseProps) {
		super();
		if (props.id != null) {
			this.id = props.id;
		}
		this.type = props.type;
		this.school = props.school;
	}

	@Enum({ nullable: false })
	type: SchoolLicenseType;

	@ManyToOne(() => SchoolEntity, { nullable: false })
	school: SchoolEntity;
}
