import { faker } from '@faker-js/faker';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '@src/modules/common-cartridge';
import { CommonCartridgeWebLinkResourcePropsV110 } from '@src/modules/common-cartridge/resources/v1.1.0/common-cartridge-web-link-resource';
import { CommonCartridgeWebLinkResourcePropsV130 } from '@src/modules/common-cartridge/resources/v1.3.0/common-cartridge-web-link-resource';

export function createCommonCartridgeWeblinkResourcePropsV110(): CommonCartridgeWebLinkResourcePropsV110 {
	return {
		type: CommonCartridgeResourceType.WEB_LINK,
		identifier: faker.string.uuid(),
		title: faker.lorem.words(),
		url: faker.internet.url(),
		version: CommonCartridgeVersion.V_1_1_0,
		folder: faker.string.alphanumeric(10),
	};
}

export function createCommonCartridgeWeblinkResourcePropsV130(): CommonCartridgeWebLinkResourcePropsV130 {
	return {
		type: CommonCartridgeResourceType.WEB_LINK,
		identifier: faker.string.uuid(),
		title: faker.lorem.words(),
		url: faker.internet.url(),
		version: CommonCartridgeVersion.V_1_3_0,
		folder: faker.string.alphanumeric(10),
	};
}
