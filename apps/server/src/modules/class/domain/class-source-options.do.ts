export interface ClassSourceOptionsProps {
	tspUid?: string;
}

export class ClassSourceOptions {
	protected props: ClassSourceOptionsProps;

	constructor(props: ClassSourceOptionsProps) {
		this.props = props;
	}

	get tspUid(): string | undefined {
		return this.props.tspUid;
	}
}
