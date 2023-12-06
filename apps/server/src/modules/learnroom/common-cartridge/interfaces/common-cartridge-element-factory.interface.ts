import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement } from './common-cartridge-element.interface';

export type CommonCartridgeElementProps = { version: CommonCartridgeVersion };

export abstract class CommonCartridgeElementFactory {
	abstract createElement(props: CommonCartridgeElementProps): CommonCartridgeElement;
}
