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
	const setup = () => {
		const sut = new CommonCartridgeResourceFactoryV110();

		return { sut };
	};

	describe('createResource', () => {
		describe('when creating resources from props', () => {
			it('shoul return web content resource', () => {
				const { sut } = setup();
				const result = sut.createResource({
					type: CommonCartridgeResourceType.WEB_CONTENT,
					version: CommonCartridgeVersion.V_1_1_0,
					folder: faker.string.uuid(),
					identifier: faker.string.uuid(),
					title: faker.lorem.words(),
					html: faker.lorem.paragraph(),
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				});

				expect(result).toBeInstanceOf(CommonCartridgeWebContentResourceV110);
			});

			it('shoul return web link resource', () => {
				const { sut } = setup();
				const result = sut.createResource({
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
