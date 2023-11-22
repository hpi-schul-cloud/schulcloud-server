import { Entity, Property } from '@mikro-orm/core';
import { EntityId } from '@shared/domain';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';

export interface RegistrationPinsProps {
	id?: EntityId;
	email: string;
	pin: string;
	verified: boolean;
	importHash: string;
}

@Entity({ tableName: 'registrationpins' })
export class RegistrationPinsEntity extends BaseEntityWithTimestamps {
	@Property()
	email: string;

	@Property()
	pin: string;

	@Property({ default: false })
	verified: boolean;

	@Property()
	importHash: string;

	constructor(props: RegistrationPinsProps) {
		super();
		if (props.id != null) {
			this.id = props.id;
		}
		this.email = props.email;
		this.pin = props.pin;
		this.verified = props.verified;
		this.importHash = props.importHash;
	}
}
