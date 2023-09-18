import { Embeddable, Property } from '@mikro-orm/core';

export interface ClassSourceOptionsEntityProps {
	tspUid?: string;
}

@Embeddable()
export class ClassSourceOptionsEntity {
	@Property({ nullable: true })
	tspUid?: string;

	constructor(props: ClassSourceOptionsEntityProps) {
		if (props.tspUid !== undefined) {
			this.tspUid = props.tspUid;
		}
	}
}
