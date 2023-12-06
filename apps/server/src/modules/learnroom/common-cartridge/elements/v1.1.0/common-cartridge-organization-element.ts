import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';

export type CommonCartridgeOrganizationElementProps = {
	type: CommonCartridgeElementType.ORGANIZATION;
	version: CommonCartridgeVersion;
	identifier: string;
	title: string;
	items: CommonCartridgeElement[];
};

export class CommonCartridgeOrganizationElement extends CommonCartridgeElement {
	public constructor(private readonly props: CommonCartridgeOrganizationElementProps) {
		super(props);
	}

	public override getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public override getManifestXmlObject(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
			},
			title: this.props.title,
			item: this.props.items.map((item) => item.getManifestXmlObject()),
		};
	}
}
