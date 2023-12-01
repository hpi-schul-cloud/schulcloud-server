import { CommonCartridgeResourcesWrapperElement } from './common-cartridge-resources-wrapper-element';

describe('CommonCartridgeResourcesWrapperElement', () => {
	// AI next 30 lines
	describe('getManifestXml', () => {
		it('should return the correct xml object', () => {
			const element = new CommonCartridgeResourcesWrapperElement([
				{
					getManifestXml: () => {
						return {
							$: {
								identifier: 'identifier',
							},
							title: 'title',
						};
					},
				},
			]);

			expect(element.getManifestXml()).toStrictEqual({
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
