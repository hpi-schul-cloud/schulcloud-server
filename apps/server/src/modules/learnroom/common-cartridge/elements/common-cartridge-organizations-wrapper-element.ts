import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';

export class CommonCartridgeOrganizationsWrapperElement implements CommonCartridgeElement {
	constructor(private readonly items: CommonCartridgeElement[]) {}

	getManifestXmlObject(): Record<string, unknown> {
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
							item: this.items.map((items) => items.getManifestXmlObject()),
						},
					],
				},
			],
		};
	}
}
