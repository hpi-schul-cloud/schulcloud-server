import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';

type CommonCartridgeOrganizationElementProps = {
	version: CommonCartridgeVersion;
	identifier: string;
	title: string;
	items: CommonCartridgeElement[];
};

export class CommonCartridgeOrganizationElement extends CommonCartridgeElement {
	public constructor(private readonly props: CommonCartridgeOrganizationElementProps) {
		super(props);
	}

	public override getSupportedVersions(): CommonCartridgeVersion[] {
		return [CommonCartridgeVersion.V_1_1_0, CommonCartridgeVersion.V_1_3_0];
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
