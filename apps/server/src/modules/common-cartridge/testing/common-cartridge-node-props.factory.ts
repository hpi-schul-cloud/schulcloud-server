import { faker } from '@faker-js/faker';
import { CommonCartridgeOrganizationNodeProps } from '../export/builders/common-cartridge-organization-node';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../export/common-cartridge.enums';

export function createCommonCartridgeOrganizationNodeProps(): CommonCartridgeOrganizationNodeProps {
	return {
		type: CommonCartridgeElementType.ORGANIZATION,
		identifier: faker.string.uuid(),
		title: faker.lorem.words(),
		version: CommonCartridgeVersion.V_1_1_0,
	};
}
