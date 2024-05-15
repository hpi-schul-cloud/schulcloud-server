import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeElement, CommonCartridgeResource, XmlObject } from '../../interfaces';

export type CommonCartridgeOrganizationElementPropsV110 = {
	type: CommonCartridgeElementType.ORGANIZATION;
	version: CommonCartridgeVersion;
	identifier: string;
	title: string;
	items: CommonCartridgeResource | Array<CommonCartridgeElement>;
};

export class CommonCartridgeOrganizationElementV110 extends CommonCartridgeElement {
	constructor(protected readonly props: CommonCartridgeOrganizationElementPropsV110) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public getManifestXmlObject(elementType: CommonCartridgeElementType): XmlObject {
		switch (elementType) {
			case CommonCartridgeElementType.ORGANIZATION:
				return this.getManifestXmlObjectInternal();
			default:
				throw new ElementTypeNotSupportedLoggableException(elementType);
		}
	}

	private getManifestXmlObjectInternal(): XmlObject {
		const xmlObject = Array.isArray(this.props.items)
			? this.getManifestXmlObjectForMany(this.props.items)
			: this.props.items.getManifestXmlObject(CommonCartridgeElementType.ORGANIZATION);

		return xmlObject;
	}

	private getManifestXmlObjectForMany(items: Array<CommonCartridgeElement>): XmlObject {
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
