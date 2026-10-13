import { Entity, Enum, Index, ManyToOne } from '@mikro-orm/core';
import { GroupEntity } from '@modules/group/entity';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { GroupLicenseType } from '../enum';

export interface GroupLicenseEntityProps {
	id?: EntityId;
	group: GroupEntity;
	type: GroupLicenseType;
}

@Entity({ tableName: 'group-licenses', discriminatorColumn: 'type', abstract: true })
@Index({ properties: ['group', 'type'] })
export abstract class GroupLicenseEntity extends BaseEntityWithTimestamps {
	protected constructor(props: GroupLicenseEntityProps) {
		super();
		if (props.id != null) {
			this.id = props.id;
		}
		this.type = props.type;
		this.group = props.group;
	}

	@Enum({ nullable: false })
	type: GroupLicenseType;

	@ManyToOne(() => GroupEntity, { nullable: false })
	group: GroupEntity;
}
