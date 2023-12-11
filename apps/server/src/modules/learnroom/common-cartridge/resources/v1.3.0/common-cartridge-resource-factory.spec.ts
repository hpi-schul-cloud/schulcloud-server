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
	const setup = () => {
		const sut = new CommonCartridgeResourceFactoryV130();

		return { sut };
	};

	describe('createResource', () => {
		describe('when creating resources from props', () => {
			it('shoul return web content resource', () => {
				const { sut } = setup();
				const result = sut.createResource({
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
				const { sut } = setup();
				const result = sut.createResource({
					type: CommonCartridgeResourceType.WEB_LINK,
					version: CommonCartridgeVersion.V_1_3_0,
					folder: faker.string.uuid(),
					identifier: faker.string.uuid(),
					title: faker.lorem.words(),
					url: faker.internet.url(),
					target: faker.lorem.word(),
					windowFeatures: faker.lorem.words(),
				});

				expect(result).toBeDefined();
				expect(result).toBeInstanceOf(CommonCartridgeWebLinkResourceV130);
			});
		});
	});
});
