import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeElement, XmlObject } from '../../interfaces';

export type CommonCartridgeOrganizationsWrapperElementPropsV110 = {
	type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER;
	version: CommonCartridgeVersion;
	items: CommonCartridgeElement[];
};

export class CommonCartridgeOrganizationsWrapperElementV110 extends CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeOrganizationsWrapperElementPropsV110) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

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
