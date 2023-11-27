import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';

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
		if (props.id !== undefined) {
			this.id = props.id;
		}
		this.email = props.email;
		this.pin = props.pin;
		this.verified = props.verified;
		this.importHash = props.importHash;
	}
}
