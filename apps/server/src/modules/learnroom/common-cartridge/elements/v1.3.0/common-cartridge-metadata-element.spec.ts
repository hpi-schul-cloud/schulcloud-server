import { faker } from '@faker-js/faker';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import {
	CommonCartridgeMetadataElementPropsV130,
	CommonCartridgeMetadataElementV130,
} from './common-cartridge-metadata-element';

describe('CommonCartridgeMetadataElementV130', () => {
	const setup = () => {
		const props: CommonCartridgeMetadataElementPropsV130 = {
			type: CommonCartridgeElementType.METADATA,
			version: CommonCartridgeVersion.V_1_3_0,
			title: faker.lorem.words(),
			creationDate: faker.date.past(),
			copyrightOwners: [faker.person.fullName(), faker.person.fullName()],
		};
		const sut = new CommonCartridgeMetadataElementV130(props);

		return { sut, props };
	};

	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			it('should return correct version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_3_0);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using common cartridge version 1.3', () => {
			it('should return correct manifest xml object', () => {
				const { sut, props } = setup();
				const result = sut.getManifestXmlObject();

				expect(result).toStrictEqual({
					schema: 'IMS Common Cartridge',
					schemaversion: '1.3.0',
					'mnf:lom': {
						'mnf:general': {
							'mnf:title': {
								'mnf:string': props.title,
							},
						},
						'mnf:rights': {
							'mnf:copyrightAndOtherRestrictions': {
								'mnf:value': 'yes',
							},
							'mnf:description': {
								'mnf:string': `${props.creationDate.getFullYear()} ${props.copyrightOwners.join(', ')}`,
							},
						},
					},
				});
			});
		});
	});
});
