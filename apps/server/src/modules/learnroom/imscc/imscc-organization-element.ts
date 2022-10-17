import { IImsccElement } from './imscc-element.interface';

export type IImsccOrganizationProps = {
	identifier: string | number;
	title: string;
};

export class ImsccOrganizationElement implements IImsccElement {
	constructor(private readonly props: IImsccOrganizationProps) {}

	transform(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
			},
			title: this.props.title,
		};
	}
}

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
