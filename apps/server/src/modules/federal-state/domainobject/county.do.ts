export interface CountyProps {
	name: string;
	countyId: number;
	antaresKey: string;
}

export class CountyDO {
	protected props: CountyProps;

	constructor(props: CountyProps) {
		this.props = props;
	}

	get name(): string {
		return this.props.name;
	}

	get countyId(): number {
		return this.props.countyId;
	}

	get antaresKey(): string {
		return this.props.antaresKey;
	}
}
