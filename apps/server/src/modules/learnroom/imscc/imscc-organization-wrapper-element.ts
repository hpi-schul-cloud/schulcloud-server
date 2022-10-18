import { IImsccElement } from './imscc-element.interface';
import { ImsccOrganizationElement } from './imscc-organization-element';

export class ImsccOrganizationWrapperElement implements IImsccElement {
	constructor(private readonly organizationElements: ImsccOrganizationElement[]) {}

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
