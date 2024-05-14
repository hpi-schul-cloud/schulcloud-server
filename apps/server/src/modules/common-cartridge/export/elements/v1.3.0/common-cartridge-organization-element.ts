import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeBase, CommonCartridgeOrganization, CommonCartridgeResource, XmlObject } from '../../interfaces';

export type CommonCartridgeOrganizationElementPropsV130 = {
	type: CommonCartridgeElementType.ORGANIZATION;
	version: CommonCartridgeVersion;
	identifier: string;
	title: string;
	items:
		| (CommonCartridgeBase & CommonCartridgeOrganization & CommonCartridgeResource)
		| Array<CommonCartridgeBase & CommonCartridgeOrganization>;
};

export class CommonCartridgeOrganizationElementV130 extends CommonCartridgeBase implements CommonCartridgeOrganization {
	constructor(private readonly props: CommonCartridgeOrganizationElementPropsV130) {
		super(props);
	}

	public isResource(): boolean {
		return false;
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}

	public getManifestOrganizationXmlObject(): XmlObject {
		const xmlObject = Array.isArray(this.props.items)
			? this.getManifestXmlObjectForMany(this.props.items)
			: this.props.items.getManifestOrganizationXmlObject();

		return xmlObject;
	}

	public getManifestResourceXmlObject(): XmlObject {
		throw new Error('CommonCartridgeOrganizationElementV130 does not support getManifestResourceXmlObject');
	}

	private getManifestXmlObjectForMany(items: Array<CommonCartridgeBase & CommonCartridgeOrganization>): XmlObject {
		const xmlObject = {
			$: {
				identifier: this.identifier,
			},
			title: this.title,
			item: items.map((item) => item.getManifestOrganizationXmlObject()),
		};

		return xmlObject;
	}
}
