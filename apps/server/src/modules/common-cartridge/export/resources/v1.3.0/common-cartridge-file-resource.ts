import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeResource, XmlObject } from '../../interfaces';
import { createIdentifier } from '../../utils';

export type CommonCartridgeFileResourcePropsV130 = {
	type: CommonCartridgeResourceType.FILE;
	version: CommonCartridgeVersion;
	identifier: string;
	folder: string;
	fileName: string;
	fileContent: Buffer;
	title: string;
};

export class CommonCartridgeFileResourceV130 extends CommonCartridgeResource {
	constructor(private readonly props: CommonCartridgeFileResourcePropsV130) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}

	public getFilePath(): string {
		return `${this.props.folder}/${this.props.fileName}`;
	}

	public getFileContent(): Buffer {
		return this.props.fileContent;
	}

	public getManifestXmlObject(elementType: CommonCartridgeElementType): XmlObject {
		switch (elementType) {
			case CommonCartridgeElementType.RESOURCE:
				return this.getManifestResourceXmlObject();
			case CommonCartridgeElementType.ORGANIZATION:
				return this.getManifestOrganizationXmlObject();
			default:
				throw new ElementTypeNotSupportedLoggableException(elementType);
		}
	}

	private getManifestOrganizationXmlObject(): XmlObject {
		return {
			$: {
				identifier: createIdentifier(),
				identifierref: this.props.identifier,
			},
			title: this.props.title,
		};
	}

	private getManifestResourceXmlObject(): XmlObject {
		return {
			$: {
				identifier: this.props.identifier,
				type: CommonCartridgeResourceType.WEB_CONTENT,
			},
			file: {
				$: {
					href: this.getFilePath(),
				},
			},
		};
	}
}
