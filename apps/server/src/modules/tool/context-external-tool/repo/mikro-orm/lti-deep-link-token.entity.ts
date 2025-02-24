import { Entity, Index, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { User } from '@modules/user/repo';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';

export interface LtiDeepLinkTokenEntityProps {
	id?: EntityId;

	state: string;

	user: User;

	expiresAt: Date;
}

@Entity({ tableName: 'lti-deep-link-token' })
export class LtiDeepLinkTokenEntity extends BaseEntityWithTimestamps {
	@Unique()
	@Property()
	state: string;

	@ManyToOne(() => User)
	user: User;

	@Index({ options: { expireAfterSeconds: 0 } })
	@Property()
	expiresAt: Date;

	constructor(props: LtiDeepLinkTokenEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.state = props.state;
		this.user = props.user;
		this.expiresAt = props.expiresAt;
	}
}
