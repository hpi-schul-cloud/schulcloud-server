import { CommonCartridgeElement } from './common-cartridge-element.interface';
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

function isOrganizationItemCollectionArray(
	children: OrganizationItemCollection[] | OrganizationResourceCollection
): children is OrganizationItemCollection[] {
	return Array.isArray(children);
}

function createRecordForResourceCollection(
	resourceCollection: OrganizationResourceCollection
): Record<string, unknown> {
	return {
		$: {
			identifier: resourceCollection.identifier,
		},
		title: resourceCollection.title,
		item: resourceCollection.resources.map((content) => {
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

export class CommonCartridgeOrganizationItemElement implements CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeOrganizationItemElementProps) {}

	transform(): Record<string, unknown> {
		if (isOrganizationItemCollection(this.props) && isOrganizationItemCollectionArray(this.props.children)) {
			return {
				$: {
					identifier: createIdentifier(),
				},
				title: this.props.title,
				item: this.props.children.map((child) => new CommonCartridgeOrganizationItemElement(child).transform()), // TODO rekursiv weiter?
			};
		}

		if (isOrganizationItemCollection(this.props) && !isOrganizationItemCollectionArray(this.props.children)) {
			return createRecordForResourceCollection(this.props.children);
		}

		if (isOrganizationResourceCollection(this.props)) {
			return createRecordForResourceCollection(this.props);
		}

		return {};
	}
}
