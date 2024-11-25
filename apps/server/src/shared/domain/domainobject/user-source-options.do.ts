export interface UserSourceOptionsProps {
	tspUid?: string;
}

export class UserSourceOptions {
	protected props: UserSourceOptionsProps;

	constructor(props: UserSourceOptionsProps) {
		this.props = props;
	}

	get tspUid(): string | undefined {
		return this.props.tspUid;
	}
}
