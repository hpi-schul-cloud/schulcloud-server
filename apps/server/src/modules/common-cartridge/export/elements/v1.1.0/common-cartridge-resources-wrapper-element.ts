import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeElement, XmlObject } from '../../interfaces';

export type CommonCartridgeResourcesWrapperElementPropsV110 = {
	type: CommonCartridgeElementType.RESOURCES_WRAPPER;
	version: CommonCartridgeVersion;
	items: CommonCartridgeElement[];
};

export class CommonCartridgeResourcesWrapperElementV110 extends CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeResourcesWrapperElementPropsV110) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public getManifestXmlObject(elementType: CommonCartridgeElementType): XmlObject {
		switch (elementType) {
			case CommonCartridgeElementType.RESOURCES_WRAPPER:
				return this.getManifestXmlObjectInternal();
			default:
				throw new ElementTypeNotSupportedLoggableException(elementType);
		}
	}

	private getManifestXmlObjectInternal(): XmlObject {
		return {
			resources: [
				{
					resource: this.props.items.map((items) => items.getManifestXmlObject(CommonCartridgeElementType.RESOURCE)),
				},
			],
		};
	}
}
