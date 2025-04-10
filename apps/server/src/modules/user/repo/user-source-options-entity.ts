import { Embeddable, Property } from '@mikro-orm/core';

export interface UserSourceOptionsEntityProps {
	tspUid?: string;
}

@Embeddable()
export class UserSourceOptionsEntity {
	@Property({ nullable: true, unique: true })
	tspUid?: string;

	constructor(props: UserSourceOptionsEntityProps) {
		if (props.tspUid !== undefined) {
			this.tspUid = props.tspUid;
		}
	}
}
