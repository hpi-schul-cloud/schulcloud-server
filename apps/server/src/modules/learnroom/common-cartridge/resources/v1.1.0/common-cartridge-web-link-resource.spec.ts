import { faker } from '@faker-js/faker';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import {
	CommonCartridgeWebLinkResourcePropsV110,
	CommonCartridgeWebLinkResourceV110,
} from './common-cartridge-web-link-resource';

describe('CommonCartridgeWebLinkResourceV110', () => {
	const setup = () => {
		const props: CommonCartridgeWebLinkResourcePropsV110 = {
			type: CommonCartridgeResourceType.WEB_LINK,
			version: CommonCartridgeVersion.V_1_1_0,
			identifier: faker.string.uuid(),
			folder: faker.string.uuid(),
			title: faker.lorem.words(),
			url: faker.internet.url(),
		};
		const sut = new CommonCartridgeWebLinkResourceV110(props);

		return { sut, props };
	};

	describe('canInline', () => {});
	describe('getFilePath', () => {});
	describe('getFileContent', () => {});
	describe('getSupportedVersion', () => {});
	describe('getManifestXmlObject', () => {});
});
