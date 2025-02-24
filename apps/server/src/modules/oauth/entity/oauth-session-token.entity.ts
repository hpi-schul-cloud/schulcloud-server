import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { SystemEntity } from '@modules/system/repo';
import { User } from '@modules/user/repo';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';

export interface OauthSessionTokenEntityProps {
	id?: EntityId;

	user: User;

	system: SystemEntity;

	refreshToken: string;

	expiresAt: Date;
}

@Entity({ tableName: 'oauth-session-token' })
export class OauthSessionTokenEntity extends BaseEntityWithTimestamps {
	@ManyToOne(() => User)
	user: User;

	@ManyToOne(() => SystemEntity)
	system: SystemEntity;

	@Property()
	refreshToken: string;

	@Index({ options: { expireAfterSeconds: 0 } })
	@Property()
	expiresAt: Date;

	constructor(props: OauthSessionTokenEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.user = props.user;
		this.system = props.system;
		this.refreshToken = props.refreshToken;
		this.expiresAt = props.expiresAt;
	}
}
