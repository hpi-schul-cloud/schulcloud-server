import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { ICommonCartridgeResourceProps } from './common-cartridge-resource-item-element';
import { createIdentifier } from './utils';

export type ICommonCartridgeOrganizationProps = {
	identifier: string;
	title: string;
	version: string;
} & ({ children: ICommonCartridgeOrganizationProps[] } | { resources: ICommonCartridgeResourceProps[] });

type OrganizationItemCollection = {
	title: string;
	children: OrganizationItemCollection[] | OrganizationResourceCollection;
	_tag: 'itemCollection';
};

type OrganizationResourceCollection = {
	identifier: string;
	title: string;
	version: string;
	resources: ICommonCartridgeResourceProps[];
	_tag: 'resourceCollection';
};

export type CommonCartridgeOrganizationItemElementProps = OrganizationItemCollection | OrganizationResourceCollection;

function isOrganizationItemCollection(
	item: CommonCartridgeOrganizationItemElementProps
): item is OrganizationItemCollection {
	return item._tag === 'itemCollection';
}

function isOrganizationResourceCollection(
	item: CommonCartridgeOrganizationItemElementProps
): item is OrganizationResourceCollection {
	return item._tag === 'resourceCollection';
}

export class CommonCartridgeOrganizationItemElement implements ICommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeOrganizationItemElementProps) {}

	transform(): Record<string, unknown> {
		if (isOrganizationItemCollection(this.props)) {
			return {};
		}

		if (isOrganizationResourceCollection(this.props)) {
			return {};
		}

		return {
			$: {
				identifier: this.props.identifier,
			},
			title: this.props.title,
			item: this.props.resources.map((content) => {
				return {
					$: {
						identifier: createIdentifier(),
						identifierref: content.identifier,
					},
					title: content.title,
				};
			}),
		};
	}
}
