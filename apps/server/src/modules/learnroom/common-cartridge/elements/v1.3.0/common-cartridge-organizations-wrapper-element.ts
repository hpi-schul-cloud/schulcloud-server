import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';

export type CommonCartridgeOrganizationsWrapperElementProps = {
	type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER;
	version: CommonCartridgeVersion;
	items: CommonCartridgeElement[];
};

export class CommonCartridgeOrganizationsWrapperElement extends CommonCartridgeElement {
	public constructor(private readonly props: CommonCartridgeOrganizationsWrapperElementProps) {
		super(props);
	}

	public override getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}

	public override getManifestXmlObject(): Record<string, unknown> {
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
							item: this.props.items.map((items) => items.getManifestXmlObject()),
						},
					],
				},
			],
		};
	}
}
