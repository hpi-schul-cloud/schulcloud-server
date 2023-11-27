import { Builder } from 'xml2js';
import {
	CommonCartridgeResourceItemElement,
	ICommonCartridgeResourceProps,
} from './common-cartridge-resource-item-element';

describe('CommonCartridgeResourceItemElement', () => {
	describe('when creating a common cartridge resouce with unkown type', () => {
		it('should throw an error', () => {
			expect(
				() => new CommonCartridgeResourceItemElement({} as ICommonCartridgeResourceProps, new Builder())
			).toThrowError();
		});
	});
});
