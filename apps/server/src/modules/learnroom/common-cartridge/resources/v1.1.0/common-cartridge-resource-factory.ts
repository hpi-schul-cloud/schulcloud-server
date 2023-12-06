import {
	CommonCartridgeResourceFactory,
	CommonCartridgeResourceProps,
} from '../../interfaces/common-cartridge-resource-factory.interface';
import { CommonCartridgeResource } from '../../interfaces/common-cartridge-resource.interface';

export class CommonCartridgeResourceFactoryV110 extends CommonCartridgeResourceFactory {
	public static readonly instance = new CommonCartridgeResourceFactoryV110();

	public static getInstance(): CommonCartridgeResourceFactory {
		return this.instance;
	}

	public override createResource(props: CommonCartridgeResourceProps): CommonCartridgeResource {
		throw new Error('Method not implemented.');
	}
}
