import { PassThrough, Stream } from 'stream';
import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeResource, XmlObject } from '../../interfaces';
import { ResourceFileContent } from '../../interfaces/common-cartridge-resource.interface';
import { createIdentifier } from '../../utils';

export type FileElement = {
	fileName: string;
	file: Stream;
};

export type CommonCartridgeFileFolderResourcePropsV130 = {
	type: CommonCartridgeResourceType.FILE_FOLDER;
	version: CommonCartridgeVersion;
	identifier: string;
	folder: string;
	title: string;
	files: FileElement[];
};

export class CommonCartridgeFileFolderResourceV130 extends CommonCartridgeResource {
	constructor(private readonly props: CommonCartridgeFileFolderResourcePropsV130) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}

	public getFileContent(): ResourceFileContent[] {
		return this.props.files.map((fileElement): ResourceFileContent => {
			return {
				path: this.getFilePath(fileElement.fileName),
				content: fileElement.file.pipe(new PassThrough()),
			};
		});
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

	private getFilePath(fileName: string): string {
		return `${this.props.folder}/${fileName}`;
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
			file: this.props.files.map((fileElement) => {
				return {
					$: {
						href: this.getFilePath(fileElement.fileName),
					},
				};
			}),
		};
	}
}
