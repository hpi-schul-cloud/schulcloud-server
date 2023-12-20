import { faker } from '@faker-js/faker';
import { InternalServerErrorException } from '@nestjs/common';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import {
	CommonCartridgeMetadataElementPropsV110,
	CommonCartridgeMetadataElementV110,
} from './common-cartridge-metadata-element';

describe('CommonCartridgeMetadataElementV110', () => {
	const setup = () => {
		const props: CommonCartridgeMetadataElementPropsV110 = {
			type: CommonCartridgeElementType.METADATA,
			version: CommonCartridgeVersion.V_1_1_0,
			title: faker.lorem.words(),
			creationDate: faker.date.past(),
			copyrightOwners: [faker.person.fullName(), faker.person.fullName()],
		};
		const sut = new CommonCartridgeMetadataElementV110(props);

		return { sut, props };
	};

	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			// AI next 5 lines
			it('should return correct version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});

		describe('when using not supported Common Cartridge version', () => {
			it('should throw error', () => {
				expect(
					() =>
						new CommonCartridgeMetadataElementV110({
							type: CommonCartridgeElementType.METADATA,
							version: CommonCartridgeVersion.V_1_3_0,
						} as CommonCartridgeMetadataElementPropsV110)
				).toThrow(InternalServerErrorException);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using Common Cartridge version 1.1', () => {
			it('should return correct manifest xml object', () => {
				const { sut, props } = setup();
				const result = sut.getManifestXmlObject();

				expect(result).toStrictEqual({
					schema: 'IMS Common Cartridge',
					schemaversion: '1.1.0',
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
