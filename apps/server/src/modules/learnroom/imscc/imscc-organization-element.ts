import { IImsccElement } from './imscc-element.interface';

export type IImsccOrganizationProps = {
	identifier: string | number;
	title: string;
};

export class ImsccOrganizationElement implements IImsccElement {
	constructor(private readonly props: IImsccOrganizationProps) {}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
			},
			title: this.props.title,
		};
	}
}
