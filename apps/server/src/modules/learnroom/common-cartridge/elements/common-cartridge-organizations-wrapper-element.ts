import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';

export type CommonCartridgeOrganizationsWrapperElementProps = {
	version: CommonCartridgeVersion;
	items: CommonCartridgeElement[];
};

export class CommonCartridgeOrganizationsWrapperElement extends CommonCartridgeElement {
	public constructor(private readonly props: CommonCartridgeOrganizationsWrapperElementProps) {
		super(props);
	}

	public override getSupportedVersions(): CommonCartridgeVersion[] {
		return [CommonCartridgeVersion.V_1_1_0, CommonCartridgeVersion.V_1_3_0];
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
