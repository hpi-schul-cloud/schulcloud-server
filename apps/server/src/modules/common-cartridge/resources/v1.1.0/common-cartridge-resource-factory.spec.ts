import { faker } from '@faker-js/faker';
import {
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { CommonCartridgeResourceFactoryV110 } from './common-cartridge-resource-factory';
import { CommonCartridgeWebContentResourceV110 } from './common-cartridge-web-content-resource';
import { CommonCartridgeWebLinkResourceV110 } from './common-cartridge-web-link-resource';

describe('CommonCartridgeResourceFactoryV110', () => {
	describe('createResource', () => {
		describe('when creating resources from props', () => {
			it('should return web content resource', () => {
				const result = CommonCartridgeResourceFactoryV110.createResource({
					type: CommonCartridgeResourceType.WEB_CONTENT,
					version: CommonCartridgeVersion.V_1_1_0,
					folder: faker.string.uuid(),
					identifier: faker.string.uuid(),
					title: faker.lorem.words(),
					html: faker.lorem.paragraph(),
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				});

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeWebContentResourceV110);
			});

			it('should return web link resource', () => {
				const result = CommonCartridgeResourceFactoryV110.createResource({
					type: CommonCartridgeResourceType.WEB_LINK,
					version: CommonCartridgeVersion.V_1_1_0,
					folder: faker.string.uuid(),
					identifier: faker.string.uuid(),
					title: faker.lorem.words(),
					url: faker.internet.url(),
					target: faker.lorem.word(),
					windowFeatures: faker.lorem.words(),
				});

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeWebLinkResourceV110);
			});
		});
	});
});
