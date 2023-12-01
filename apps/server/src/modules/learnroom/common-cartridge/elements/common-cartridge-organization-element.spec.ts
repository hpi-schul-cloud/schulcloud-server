import { CommonCartridgeOrganizationElement } from './common-cartridge-organization-element';

describe('CommonCartridgeOrganizationElement', () => {
	// AI next 34 lines
	describe('getManifestXml', () => {
		it('should return the correct xml object', () => {
			const element = new CommonCartridgeOrganizationElement({
				identifier: 'identifier',
				title: 'title',
				items: [
					{
						getManifestXmlObject: () => {
							return {
								$: {
									identifier: 'identifier',
								},
								title: 'title',
							};
						},
					},
				],
			});

			expect(element.getManifestXmlObject()).toStrictEqual({
				$: {
					identifier: 'identifier',
				},
				title: 'title',
				item: [
					{
						$: {
							identifier: 'identifier',
						},
						title: 'title',
					},
				],
			});
		});
	});
});
