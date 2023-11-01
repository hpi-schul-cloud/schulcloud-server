import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { CommonCartridgeResourceWrapperElement } from './common-cartridge-resource-wrapper-element';

describe('CommonCartridgeResourceWrapperElement', () => {
	it('should transform the resource elements into an array of transformed objects', () => {
		const resourceElementsMock: ICommonCartridgeElement[] = [
			{
				transform: jest.fn().mockReturnValue({ identifier: 'resource-1' }),
			},
			{
				transform: jest.fn().mockReturnValue({ identifier: 'resource-2' }),
			},
		];

		const resourceWrapperElement = new CommonCartridgeResourceWrapperElement(resourceElementsMock);
		const result = resourceWrapperElement.transform();

		expect(result).toEqual({
			resource: [{ identifier: 'resource-1' }, { identifier: 'resource-2' }],
		});

		expect(resourceElementsMock[0].transform).toHaveBeenCalled();
		expect(resourceElementsMock[1].transform).toHaveBeenCalled();
	});
});
