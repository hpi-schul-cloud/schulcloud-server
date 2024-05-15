import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeElement, CommonCartridgeResource, XmlObject } from '../../interfaces';

export type CommonCartridgeOrganizationElementPropsV130 = {
	type: CommonCartridgeElementType.ORGANIZATION;
	version: CommonCartridgeVersion;
	identifier: string;
	title: string;
	items: CommonCartridgeResource | Array<CommonCartridgeElement>;
};

export class CommonCartridgeOrganizationElementV130 extends CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeOrganizationElementPropsV130) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}

	public getManifestXmlObject(elementType: CommonCartridgeElementType): XmlObject {
		switch (elementType) {
			case CommonCartridgeElementType.ORGANIZATION:
				return this.getManifestXmlObjectInternal();
			default:
				throw new ElementTypeNotSupportedLoggableException(elementType);
		}
	}

	public getManifestXmlObjectInternal(): XmlObject {
		const xmlObject = Array.isArray(this.props.items)
			? this.getManifestXmlObjectForCollection(this.props.items)
			: this.props.items.getManifestXmlObject(CommonCartridgeElementType.ORGANIZATION);

		return xmlObject;
	}

	private getManifestXmlObjectForCollection(items: Array<CommonCartridgeElement>): XmlObject {
		const xmlObject = {
			$: {
				identifier: this.identifier,
			},
			title: this.title,
			item: items.map((item) => item.getManifestXmlObject(CommonCartridgeElementType.ORGANIZATION)),
		};

		return xmlObject;
	}
}
