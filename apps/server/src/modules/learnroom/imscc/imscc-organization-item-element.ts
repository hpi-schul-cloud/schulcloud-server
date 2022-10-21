import { IImsccElement } from './imscc-element.interface';

export type IImsccOrganizationProps = {
	identifier: string;
	title: string;
};

export class ImsccOrganizationItemElement implements IImsccElement {
	constructor(private readonly props: IImsccOrganizationProps) {}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: `i${this.props.identifier}`,
			},
			title: this.props.title,
		};
	}
}
