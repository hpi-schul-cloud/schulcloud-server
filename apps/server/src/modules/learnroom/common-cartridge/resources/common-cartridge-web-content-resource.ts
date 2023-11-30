import {
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../common-cartridge.enums';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';

export type CommonCartridgeWebContentResourceProps = {
	type: CommonCartridgeResourceType.WEB_CONTENT;
	version: CommonCartridgeVersion;
	identifier: string;
	folder: string;
	title: string;
	html: string;
	intendedUse?: CommonCartridgeIntendedUseType;
};

export class CommonCartridgeWebContentResource implements CommonCartridgeResource {
	constructor(private readonly props: CommonCartridgeWebContentResourceProps) {}

	canInline(): boolean {
		return false;
	}

	getFilePath(): string {
		return `${this.props.folder}/${this.props.identifier}.html`;
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
					href: this.props.folder,
				},
			},
		};
	}
}
