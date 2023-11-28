import {
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../common-cartridge.enums';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';

export type ICommonCartridgeWebContentResourceProps = {
	type: CommonCartridgeResourceType.WEB_CONTENT;
	version: CommonCartridgeVersion;
	identifier: string;
	href: string;
	title: string;
	html: string;
	intendedUse?: CommonCartridgeIntendedUseType;
};

export class CommonCartridgeWebContentResource implements CommonCartridgeResource {
	constructor(private readonly props: ICommonCartridgeWebContentResourceProps) {}

	canInline(): boolean {
		return false;
	}

	// TODO: This is not correct. The href should be relative to the imsmanifest.xml file.
	getFilePath(): string {
		return this.props.href;
	}

	getFileContent(): string {
		return this.props.html;
	}

	getManifestXml(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				type: this.props.type,
				intendeduse: this.props.intendedUse ?? CommonCartridgeIntendedUseType.UNSPECIFIED,
			},
			file: {
				$: {
					href: this.props.href,
				},
			},
		};
	}
}
