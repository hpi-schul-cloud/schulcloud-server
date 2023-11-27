import { ICommonCartridgeMetadataProps, CommonCartridgeMetadataElement } from './common-cartridge-metadata-element';
import { CommonCartridgeVersion } from './common-cartridge-enums';

describe('CommonCartridgeMetadataElement', () => {
	describe('transform', () => {
		it('should return correct metadata regardless of common cartridge version', () => {
			const props: ICommonCartridgeMetadataProps = {
				title: 'title of metadata',
				copyrightOwners: 'owner of course',
				creationYear: '2023',
				version: CommonCartridgeVersion.V_1_1_0,
			};

			const metadata = new CommonCartridgeMetadataElement(props);
			const transformed = metadata.transform();
			expect(transformed).toEqual({
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
							'mnf:string': `${props.creationYear} ${props.copyrightOwners}`,
						},
					},
				},
			});
		});
	});
});
