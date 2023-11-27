import { CommonCartridgeElement } from './common-cartridge-element.interface';

export class CommonCartridgeOrganizationWrapperElement implements CommonCartridgeElement {
	constructor(private readonly organizationElements: CommonCartridgeElement[]) {}

	transform(): Record<string, unknown> {
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
							item: this.organizationElements.map((organizationElement) => organizationElement.transform()),
						},
					],
				},
			],
		};
	}
}
