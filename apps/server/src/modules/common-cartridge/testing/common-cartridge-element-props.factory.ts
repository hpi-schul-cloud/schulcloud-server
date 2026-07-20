import { faker } from '@faker-js/faker';
import {
	type CommonCartridgeElementProps,
	CommonCartridgeElementType,
	type CommonCartridgeOrganizationProps,
	CommonCartridgeVersion,
} from '@modules/common-cartridge';
import { type CommonCartridgeOrganizationNodeProps } from '../export/builders/common-cartridge-organization.types';
import { type CommonCartridgeMetadataElementPropsV110 } from '../export/elements/v1.1.0/common-cartridge-metadata-element';
import { type CommonCartridgeOrganizationElementPropsV110 } from '../export/elements/v1.1.0/common-cartridge-organization-element';
import { type CommonCartridgeOrganizationsWrapperElementPropsV110 } from '../export/elements/v1.1.0/common-cartridge-organizations-wrapper-element';
import { type CommonCartridgeResourcesWrapperElementPropsV110 } from '../export/elements/v1.1.0/common-cartridge-resources-wrapper-element';
import { type CommonCartridgeMetadataElementPropsV130 } from '../export/elements/v1.3.0/common-cartridge-metadata-element';
import { type CommonCartridgeOrganizationElementPropsV130 } from '../export/elements/v1.3.0/common-cartridge-organization-element';
import { type CommonCartridgeOrganizationsWrapperElementPropsV130 } from '../export/elements/v1.3.0/common-cartridge-organizations-wrapper-element';
import { type CommonCartridgeResourcesWrapperElementPropsV130 } from '../export/elements/v1.3.0/common-cartridge-resources-wrapper-element';
import { type CommonCartridgeElement } from '../export/interfaces/common-cartridge-element.interface';
import { type CommonCartridgeResource } from '../export/interfaces/common-cartridge-resource.interface';

export function createCommonCartridgeMetadataElementPropsV110(): CommonCartridgeMetadataElementPropsV110 {
	return {
		type: CommonCartridgeElementType.METADATA,
		version: CommonCartridgeVersion.V_1_1_0,
		title: faker.lorem.words(),
		creationDate: faker.date.past(),
		copyrightOwners: [faker.person.fullName(), faker.person.fullName()],
	};
}

export function createCommonCartridgeMetadataElementPropsV130(): CommonCartridgeMetadataElementPropsV130 {
	return {
		type: CommonCartridgeElementType.METADATA,
		version: CommonCartridgeVersion.V_1_3_0,
		title: faker.lorem.words(),
		creationDate: faker.date.past(),
		copyrightOwners: [faker.person.fullName(), faker.person.fullName()],
	};
}

export function createCommonCartridgeOrganizationElementPropsV110(
	items?: CommonCartridgeResource | Array<CommonCartridgeElement | CommonCartridgeResource>
): CommonCartridgeOrganizationElementPropsV110 {
	return {
		type: CommonCartridgeElementType.ORGANIZATION,
		identifier: faker.string.uuid(),
		title: faker.lorem.words(),
		items: items || [],
		version: CommonCartridgeVersion.V_1_1_0,
	};
}

export function createCommonCartridgeOrganizationElementPropsV130(
	items?: CommonCartridgeResource | Array<CommonCartridgeElement | CommonCartridgeResource>
): CommonCartridgeOrganizationElementPropsV130 {
	return {
		type: CommonCartridgeElementType.ORGANIZATION,
		identifier: faker.string.uuid(),
		title: faker.lorem.words(),
		items: items || [],
		version: CommonCartridgeVersion.V_1_3_0,
	};
}

export function createCommonCartridgeOrganizationsWrapperElementPropsV110(
	items?: CommonCartridgeElement[]
): CommonCartridgeOrganizationsWrapperElementPropsV110 {
	return {
		type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER,
		version: CommonCartridgeVersion.V_1_1_0,
		items: items || [],
	};
}

export function createCommonCartridgeOrganizationsWrapperElementPropsV130(
	items?: CommonCartridgeElement[]
): CommonCartridgeOrganizationsWrapperElementPropsV130 {
	return {
		type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER,
		version: CommonCartridgeVersion.V_1_3_0,
		items: items || [],
	};
}

export function createCommonCartridgeResourcesWrapperElementPropsV110(
	items?: CommonCartridgeResource[]
): CommonCartridgeResourcesWrapperElementPropsV110 {
	return {
		type: CommonCartridgeElementType.RESOURCES_WRAPPER,
		version: CommonCartridgeVersion.V_1_1_0,
		items: items || [],
	};
}

export function createCommonCartridgeResourcesWrapperElementPropsV130(
	items?: CommonCartridgeResource[]
): CommonCartridgeResourcesWrapperElementPropsV130 {
	return {
		type: CommonCartridgeElementType.RESOURCES_WRAPPER,
		version: CommonCartridgeVersion.V_1_3_0,
		items: items || [],
	};
}

export function createCommonCartridgeMetadataElementProps(): CommonCartridgeElementProps {
	return {
		type: CommonCartridgeElementType.METADATA,
		title: faker.lorem.words(),
		creationDate: new Date(),
		copyrightOwners: ['John Doe', 'Jane Doe'],
	};
}

export function createCommonCartridgeOrganizationProps(): CommonCartridgeOrganizationProps {
	return {
		title: faker.lorem.words(),
		identifier: faker.string.uuid(),
	};
}

export function createCommonCartridgeOrganizationNodeProps(): CommonCartridgeOrganizationNodeProps {
	return {
		type: CommonCartridgeElementType.ORGANIZATION,
		identifier: faker.string.uuid(),
		title: faker.lorem.words(),
		version: CommonCartridgeVersion.V_1_1_0,
	};
}
