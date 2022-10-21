import { IImsccElement } from './imscc-element.interface';

export type IImsccResourceProps = {
	identifier: string;
	type: string;
	href: string;
};

export class ImsccResourceItemElement implements IImsccElement {
	constructor(private readonly props: IImsccResourceProps) {}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				type: this.props.type,
			},
			file: {
				$: {
					href: this.props.href,
				},
			},
		};
	}
}
