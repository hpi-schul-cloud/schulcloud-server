import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeElement, XmlObject } from '../../interfaces';

export type CommonCartridgeResourcesWrapperElementProps = {
	type: CommonCartridgeElementType.RESOURCES_WRAPPER;
	version: CommonCartridgeVersion;
	items: CommonCartridgeElement[];
};

/**
 * This abstract class was created to reduce code duplication and
 * keep the SonarCloud code duplication rate below 3%.
 */
export abstract class CommonCartridgeResourcesWrapperElement extends CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeResourcesWrapperElementProps) {
		super(props);
	}

	abstract getSupportedVersion(): CommonCartridgeVersion;

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
