import { faker } from '@faker-js/faker';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '@src/modules/common-cartridge';
import { CommonCartridgeMetadataElementPropsV110 } from '@src/modules/common-cartridge/elements/v1.1.0/common-cartridge-metadata-element';
import { CommonCartridgeOrganizationElementPropsV110 } from '@src/modules/common-cartridge/elements/v1.1.0/common-cartridge-organization-element';
import { CommonCartridgeOrganizationsWrapperElementPropsV110 } from '@src/modules/common-cartridge/elements/v1.1.0/common-cartridge-organizations-wrapper-element';
import { CommonCartridgeResourcesWrapperElementPropsV110 } from '@src/modules/common-cartridge/elements/v1.1.0/common-cartridge-resources-wrapper-element';
import { CommonCartridgeMetadataElementPropsV130 } from '@src/modules/common-cartridge/elements/v1.3.0/common-cartridge-metadata-element';
import { CommonCartridgeOrganizationElementPropsV130 } from '@src/modules/common-cartridge/elements/v1.3.0/common-cartridge-organization-element';
import { CommonCartridgeOrganizationsWrapperElementPropsV130 } from '@src/modules/common-cartridge/elements/v1.3.0/common-cartridge-organizations-wrapper-element';
import { CommonCartridgeResourcesWrapperElementPropsV130 } from '@src/modules/common-cartridge/elements/v1.3.0/common-cartridge-resources-wrapper-element';
import { CommonCartridgeElement } from '@src/modules/common-cartridge/interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '@src/modules/common-cartridge/interfaces/common-cartridge-resource.interface';

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

export function createCommonCartridgeOrganizationElementPropsV130(): CommonCartridgeOrganizationElementPropsV130 {
	return {
		type: CommonCartridgeElementType.ORGANIZATION,
		identifier: faker.string.uuid(),
		title: faker.lorem.words(),
		items: [],
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
