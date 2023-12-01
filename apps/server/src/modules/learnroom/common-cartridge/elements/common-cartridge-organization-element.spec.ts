import { CommonCartridgeOrganizationElement } from './common-cartridge-organization-element';

describe('CommonCartridgeOrganizationElement', () => {
	const sut = new CommonCartridgeOrganizationElement({
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

	describe('getManifestXmlObject', () => {
		describe('when building common cartridge manifest', () => {
			it('should return correct xml object', () => {
				const xmlObject = sut.getManifestXmlObject();

				expect(xmlObject).toStrictEqual({
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
});
