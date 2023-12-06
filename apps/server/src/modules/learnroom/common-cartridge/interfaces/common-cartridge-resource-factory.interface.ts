import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeResource } from './common-cartridge-resource.interface';

export type CommonCartridgeResourceProps = { version: CommonCartridgeVersion };

export abstract class CommonCartridgeResourceFactory {
	abstract createResource(props: CommonCartridgeResourceProps): CommonCartridgeResource;
}
