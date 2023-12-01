import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeManifestElementProps } from './common-cartridge-manifest-resource';

describe('CommonCartridgeManifestResource', () => {
	const propsOfVersion1: CommonCartridgeManifestElementProps = {
		version: CommonCartridgeVersion.V_1_1_0,
		identifier: 'manifest-v1',
		metadata: {
			getManifestXml: () => {
				return {
					schema: 'IMS Common Cartridge',
					schemaversion: propsOfVersion1.version,
					'mnf:lom': {
						'mnf:general': {
							'mnf:title': {
								'mnf:string': 'Manifest v1',
							},
						},
						'mnf:rights': {
							'mnf:copyrightAndOtherRestrictions': {
								'mnf:value': 'yes',
							},
							'mnf:description': {
								'mnf:string': 'Test Manifest V1',
							},
						},
					},
				};
			},
		},
		organizations: [],
		resources: [],
	};
});
