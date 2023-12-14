import { faker } from '@faker-js/faker';
import {
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { CommonCartridgeResourceFactoryV130 } from './common-cartridge-resource-factory';
import { CommonCartridgeWebContentResourceV130 } from './common-cartridge-web-content-resource';
import { CommonCartridgeWebLinkResourceV130 } from './common-cartridge-web-link-resource';

describe('CommonCartridgeResourceFactoryV130', () => {
	describe('createResource', () => {
		describe('when creating resources from props', () => {
			it('shoul return web content resource', () => {
				const result = CommonCartridgeResourceFactoryV130.createResource({
					type: CommonCartridgeResourceType.WEB_CONTENT,
					version: CommonCartridgeVersion.V_1_3_0,
					folder: faker.string.uuid(),
					identifier: faker.string.uuid(),
					title: faker.lorem.words(),
					html: faker.lorem.paragraph(),
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				});

				expect(result).toBeInstanceOf(CommonCartridgeWebContentResourceV130);
			});

			it('shoul return web link resource', () => {
				const result = CommonCartridgeResourceFactoryV130.createResource({
					type: CommonCartridgeResourceType.WEB_LINK,
					version: CommonCartridgeVersion.V_1_3_0,
					folder: faker.string.uuid(),
					identifier: faker.string.uuid(),
					title: faker.lorem.words(),
					url: faker.internet.url(),
					target: faker.lorem.word(),
					windowFeatures: faker.lorem.words(),
				});

				expect(result).toBeInstanceOf(CommonCartridgeWebLinkResourceV130);
			});
		});
	});
});
