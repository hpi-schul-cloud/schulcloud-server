import { Entity, Enum, Index, ManyToOne } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { User as UserEntity } from '@shared/domain/entity/user.entity';
import { EntityId } from '@shared/domain/types';
import { UserLicenseType } from './user-license-type';

export interface UserLicenseProps {
	id?: EntityId;
	user: UserEntity;
	type: UserLicenseType;
}

@Entity({ tableName: 'user-licenses', discriminatorColumn: 'type', abstract: true })
@Index({ properties: ['user', 'type'] })
export abstract class UserLicenseEntity extends BaseEntityWithTimestamps {
	protected constructor(props: UserLicenseProps) {
		super();
		if (props.id != null) {
			this.id = props.id;
		}
		this.type = props.type;
		this.user = props.user;
	}

	@Enum({ nullable: false })
	type: UserLicenseType;

	@ManyToOne({ nullable: false })
	user: UserEntity;
}
