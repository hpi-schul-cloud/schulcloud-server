import { ICommonCartridgeElement } from './common-cartridge-element.interface';

export class CommonCartridgeOrganizationWrapperElement implements ICommonCartridgeElement {
	constructor(private readonly organizationElements: ICommonCartridgeElement[]) {}

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
							item: this.organizationElements.map((organizationElement) => {
								return organizationElement.transform();
							}),
						},
					],
				},
			],
		};
	}
}
