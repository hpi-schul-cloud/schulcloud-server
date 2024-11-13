import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { CommonCartridgeResource, XmlObject } from '../../interfaces';

export type CommonCartridgeFileResourcePropsV110 = {
	version: CommonCartridgeVersion.V_1_1_0;
	type: CommonCartridgeResourceType.FILE;
};

export class CommonCartridgeFileResource extends CommonCartridgeResource {
	constructor(private readonly props: CommonCartridgeFileResourcePropsV110) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public getFilePath(): string {
		throw new Error('Method not implemented.');
	}

	public getFileContent(): string {
		throw new Error('Method not implemented.');
	}

	public getManifestXmlObject(elementType: CommonCartridgeElementType): XmlObject {
		throw new Error('Method not implemented.');
	}
}
