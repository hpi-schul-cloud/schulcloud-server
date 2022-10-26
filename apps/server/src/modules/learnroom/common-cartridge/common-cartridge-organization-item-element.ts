import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export type ICommonCartridgeOrganizationProps = {
	identifier: string;
	title?: string;
	description?: string;
	items?: CommonCartridgeOrganizationItemElement[];
};

export class CommonCartridgeOrganizationItemElement implements ICommonCartridgeElement {
	constructor(private readonly props: ICommonCartridgeOrganizationProps) {}

	addChild(props: ICommonCartridgeOrganizationProps): this {
		if (!this.props.items) {
			this.props.items = [];
		}
		this.props.items.push(new CommonCartridgeOrganizationItemElement(props));
		return this;
	}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
			},
			title: this.props.title,
			description: this.props.description,
			item: this.props.items?.map((item) => item.transform()) ?? [],
		};
	}
}
