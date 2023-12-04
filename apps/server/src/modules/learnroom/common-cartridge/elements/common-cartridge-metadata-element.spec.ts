import { CommonCartridgeVersion } from '../common-cartridge.enums';
import {
	CommonCartridgeMetadataElement,
	CommonCartridgeMetadataElementProps,
} from './common-cartridge-metadata-element';

describe('CommonCartridgeMetadataElement', () => {
	describe('getManifestXmlObject', () => {
		describe('when using common cartridge version 1.1', () => {
			const propsVersion1: CommonCartridgeMetadataElementProps = {
				version: CommonCartridgeVersion.V_1_1_0,
				title: 'Metadata Element Version 1.1',
				creationDate: new Date(),
				copyrightOwners: ['copyrightOwner1Version1', 'copyrightOwner2Version1'],
			};

			const sut = new CommonCartridgeMetadataElement(propsVersion1);

			it('should return correct xml object', () => {
				const xmlObject = sut.getManifestXmlObject();

				expect(xmlObject).toStrictEqual({
					schema: 'IMS Common Cartridge',
					schemaversion: propsVersion1.version,
					'mnf:lom': {
						'mnf:general': {
							'mnf:title': {
								'mnf:string': propsVersion1.title,
							},
						},
						'mnf:rights': {
							'mnf:copyrightAndOtherRestrictions': {
								'mnf:value': 'yes',
							},
							'mnf:description': {
								'mnf:string': `${propsVersion1.creationDate.getFullYear()} ${propsVersion1.copyrightOwners.join(
									', '
								)}`,
							},
						},
					},
				});
			});
		});

		describe('when using common cartridge version 1.3', () => {
			const propsVersion3: CommonCartridgeMetadataElementProps = {
				version: CommonCartridgeVersion.V_1_3_0,
				title: 'Metadata Element Version 1.3',
				creationDate: new Date(),
				copyrightOwners: ['copyrightOwner1Version3', 'copyrightOwner2Version3'],
			};

			const sut = new CommonCartridgeMetadataElement(propsVersion3);

			it('should return correct xml object', () => {
				const xmlObject = sut.getManifestXmlObject();

				expect(xmlObject).toStrictEqual({
					schema: 'IMS Common Cartridge',
					schemaversion: propsVersion3.version,
					'mnf:lom': {
						'mnf:general': {
							'mnf:title': {
								'mnf:string': propsVersion3.title,
							},
						},
						'mnf:rights': {
							'mnf:copyrightAndOtherRestrictions': {
								'mnf:value': 'yes',
							},
							'mnf:description': {
								'mnf:string': `${propsVersion3.creationDate.getFullYear()} ${propsVersion3.copyrightOwners.join(
									', '
								)}`,
							},
						},
					},
				});
			});
		});
	});
});
