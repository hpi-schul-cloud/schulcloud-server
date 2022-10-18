import {IImsccElement} from './imscc-element.interface';

export type IImsccResourceProps = {
	identifier: string | number;
	type: string;
	href: string;
	file: string;
};

export class ImsccResourceElement implements IImsccElement {
	constructor(private readonly props: IImsccResourceProps) {}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				type: this.props.type,
				href: this.props.href,
			},
			file: this.props.file,
		};
	}
}

