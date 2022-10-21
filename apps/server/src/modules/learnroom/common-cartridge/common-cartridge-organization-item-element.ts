import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export type ICommonCartridgeOrganizationProps = {
	identifier: string;
	title: string;
};

export class CommonCartridgeOrganizationItemElement implements ICommonCartridgeElement {
	constructor(private readonly props: ICommonCartridgeOrganizationProps) {}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: `i${this.props.identifier}`,
			},
			title: this.props.title,
		};
	}
}
