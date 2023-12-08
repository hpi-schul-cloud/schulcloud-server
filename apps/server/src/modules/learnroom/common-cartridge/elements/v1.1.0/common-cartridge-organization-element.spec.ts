import { faker } from '@faker-js/faker';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';
import {
	CommonCartridgeOrganizationElementPropsV110,
	CommonCartridgeOrganizationElementV110,
} from './common-cartridge-organization-element';

describe('CommonCartridgeOrganizationElementV110', () => {
	const setup = () => {
		const item: CommonCartridgeElement = {
			getManifestXmlObject: () => {
				return {
					$: {
						identifier: faker.string.uuid(),
					},
					title: faker.lorem.words(),
				};
			},
			getSupportedVersion: () => CommonCartridgeVersion.V_1_1_0,
			checkVersion: () => CommonCartridgeVersion.V_1_1_0,
		};

		const props: CommonCartridgeOrganizationElementPropsV110 = {
			type: CommonCartridgeElementType.ORGANIZATION,
			version: CommonCartridgeVersion.V_1_1_0,
			identifier: faker.string.uuid(),
			title: faker.lorem.words(),
			items: [item],
		};
		const sut = new CommonCartridgeOrganizationElementV110(props);

		return { sut, props };
	};

	describe('getSupportedVersion', () => {
		describe('when using common cartridge version 1.1.0', () => {
			it('should return correct version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});
	});
});
