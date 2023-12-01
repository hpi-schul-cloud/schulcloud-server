import { CommonCartridgeVersion } from '../common-cartridge.enums';
import {
	CommonCartridgeMetadataElement,
	CommonCartridgeMetadataElementProps,
} from './common-cartridge-metadata-element';

describe('CommonCartridgeMetadataElement', () => {
	const propsVersion1: CommonCartridgeMetadataElementProps = {
		version: CommonCartridgeVersion.V_1_1,
		title: 'Metadata Element Version 1.1',
		creationDate: new Date(),
		copyrightOwners: ['copyrightOwner1Version1', 'copyrightOwner2Version1'],
	};

	const propsVersion3: CommonCartridgeMetadataElementProps = {
		version: CommonCartridgeVersion.V_1_3,
		title: 'Metadata Element Version 1.3',
		creationDate: new Date(),
		copyrightOwners: ['copyrightOwner1Version3', 'copyrightOwner2Version3'],
	};

	const metadataElementVersion1 = new CommonCartridgeMetadataElement(propsVersion1);
	const metadataElementVersion3 = new CommonCartridgeMetadataElement(propsVersion3);

	describe('getManifestXml', () => {
		describe('when the return value of the method is called', () => {
			it('should return manifest xml content regardless of the common cartridge version', () => {
				const transformed = metadataElement.getManifestXml();

				expect(transformed).toStrictEqual({
					schema: 'IMS Common Cartridge',
					schemaversion: props.version,
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
								'mnf:string': `${props.creationDate.getFullYear()} ${props.creationDate.getFullYear()}`,
							},
						},
					},
				});
			});
		});
	});
});
