import { Entity, Index, Property } from '@mikro-orm/core';
import { EntityId } from '@shared/domain';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';

export interface RegistrationPinEntityProps {
	id?: EntityId;
	email: string;
	pin: string;
	verified: boolean;
	importHash: string;
}

@Entity({ tableName: 'registrationpins' })
@Index({ properties: ['email', 'pin'] })
export class RegistrationPinEntity extends BaseEntityWithTimestamps {
	@Property()
	@Index()
	email: string;

	@Property()
	pin: string;

	@Property({ default: false })
	verified: boolean;

	@Property()
	@Index()
	importHash: string;

	constructor(props: RegistrationPinEntityProps) {
		super();
		if (props.id !== null) {
			this.id = props.id;
		}
		this.email = props.email;
		this.pin = props.pin;
		this.verified = props.verified;
		this.importHash = props.importHash;
	}
}
