import { Embeddable, Property } from '@mikro-orm/decorators/legacy';

export interface UserParentsEntityProps {
	firstName: string;
	lastName: string;
	email: string;
}

@Embeddable()
export class UserParentsEntity {
	@Property()
	firstName: string;

	@Property()
	lastName: string;

	@Property()
	email: string;

	constructor(props: UserParentsEntityProps) {
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
	}
}
