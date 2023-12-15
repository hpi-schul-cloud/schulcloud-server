import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';

export type CommonCartridgeOrganizationElementPropsV110 = {
	type: CommonCartridgeElementType.ORGANIZATION;
	version: CommonCartridgeVersion;
	identifier: string;
	title: string;
	items: CommonCartridgeElement[];
};

export class CommonCartridgeOrganizationElementV110 extends CommonCartridgeElement {
	public constructor(private readonly props: CommonCartridgeOrganizationElementPropsV110) {
		super(props);
	}

	public override getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public override getManifestXmlObject(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				identifierref: this.props.items.length === 1 ? this.props.items[0].identifier : undefined,
			},
			title: this.props.title,
			// item: this.props.items.map((item) => item.getManifestXmlObject()),
		};
	}
}
