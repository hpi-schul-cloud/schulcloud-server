import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeElement, XmlObject } from '../../interfaces';

export type CommonCartridgeOrganizationsWrapperElementProps = {
	type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER;
	version: CommonCartridgeVersion;
	items: CommonCartridgeElement[];
};

/**
 * This abstract class was created to reduce code duplication and
 * keep the SonarCloud code duplication rate below 3%.
 */
export abstract class CommonCartridgeOrganizationsWrapperElement extends CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeOrganizationsWrapperElementProps) {
		super(props);
	}

	abstract getSupportedVersion(): CommonCartridgeVersion;

	public getManifestXmlObject(elementType: CommonCartridgeElementType): XmlObject {
		switch (elementType) {
			case CommonCartridgeElementType.ORGANIZATIONS_WRAPPER:
				return this.getManifestXmlObjectInternal();
			default:
				throw new ElementTypeNotSupportedLoggableException(elementType);
		}
	}

	private getManifestXmlObjectInternal(): XmlObject {
		return {
			organization: [
				{
					$: {
						identifier: 'org-1',
						structure: 'rooted-hierarchy',
					},
					item: [
						{
							$: {
								identifier: 'LearningModules',
							},
							item: this.props.items.map((items) =>
								items.getManifestXmlObject(CommonCartridgeElementType.ORGANIZATION)
							),
						},
					],
				},
			],
		};
	}
}
