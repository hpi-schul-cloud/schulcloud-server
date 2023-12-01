import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';

type CommonCartridgeOrganizationElementProps = {
	identifier: string;
	title: string;
	items: CommonCartridgeElement[];
};

export class CommonCartridgeOrganizationElement implements CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeOrganizationElementProps) {}

	getManifestXmlObject(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
			},
			title: this.props.title,
			item: this.props.items.map((item) => item.getManifestXmlObject()),
		};
	}
}
