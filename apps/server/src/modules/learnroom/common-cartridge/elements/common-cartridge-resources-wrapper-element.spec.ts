import { CommonCartridgeResourcesWrapperElement } from './common-cartridge-resources-wrapper-element';

describe('CommonCartridgeResourcesWrapperElement', () => {
	const sut = new CommonCartridgeResourcesWrapperElement([
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
	]);

	describe('getManifestXmlObject', () => {
		describe('when building common cartridge manifest', () => {
			it('should return the correct xml object', () => {
				const xmlObject = sut.getManifestXmlObject();

				expect(xmlObject).toStrictEqual({
					resources: [
						{
							resource: [
								{
									$: {
										identifier: 'identifier',
									},
									title: 'title',
								},
							],
						},
					],
				});
			});
		});
	});
});
