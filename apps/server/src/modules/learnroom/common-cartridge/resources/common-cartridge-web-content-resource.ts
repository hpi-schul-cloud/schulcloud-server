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
};

export class CommonCartridgeWebContentResource implements CommonCartridgeResource {
	constructor(private readonly props: CommonCartridgeWebContentResourceProps) {}

	public canInline(): boolean {
		return false;
	}

	public getFilePath(): string {
		return `${this.props.folder}/${this.props.identifier}.html`;
	}

	public getFileContent(): string {
		return this.props.html;
	}

	public getManifestXmlObject(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				type: this.props.type,
				intendeduse:
					this.props.version === CommonCartridgeVersion.V_1_3_0
						? CommonCartridgeIntendedUseType.ASSIGNMENT
						: CommonCartridgeIntendedUseType.UNSPECIFIED,
			},
			file: {
				$: {
					href: this.getFilePath(),
				},
			},
		};
	}
}
