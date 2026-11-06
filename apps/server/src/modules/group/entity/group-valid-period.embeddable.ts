import { Embeddable, Property } from '@mikro-orm/decorators/legacy';

export interface GroupValidPeriodEntityProps {
	from: Date;

	until: Date;
}

@Embeddable()
export class GroupValidPeriodEmbeddable {
	@Property()
	from: Date;

	@Property()
	until: Date;

	constructor(props: GroupValidPeriodEntityProps) {
		this.from = props.from;
		this.until = props.until;
	}
}
