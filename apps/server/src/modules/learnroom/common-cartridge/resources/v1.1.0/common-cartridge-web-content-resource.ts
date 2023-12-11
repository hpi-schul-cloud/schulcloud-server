import {
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { CommonCartridgeResource } from '../../interfaces/common-cartridge-resource.interface';

export type CommonCartridgeWebContentResourcePropsV110 = {
	type: CommonCartridgeResourceType.WEB_CONTENT;
	version: CommonCartridgeVersion.V_1_1_0;
	identifier: string;
	folder: string;
	title: string;
	html: string;
	intendedUse:
		| CommonCartridgeIntendedUseType.UNSPECIFIED
		| CommonCartridgeIntendedUseType.LESSON_PLAN
		| CommonCartridgeIntendedUseType.SYLLABUS;
};

export class CommonCartridgeWebContentResourceV110 extends CommonCartridgeResource {
	public constructor(private readonly props: CommonCartridgeWebContentResourcePropsV110) {
		super(props);
	}

	public override canInline(): boolean {
		return false;
	}

	public override getFilePath(): string {
		return `${this.props.folder}/${this.props.identifier}.html`;
	}

	public override getFileContent(): string {
		return this.props.html;
	}

	public override getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public override getManifestXmlObject(): Record<string, unknown> {
		return {
			$: {
				identifier: this.props.identifier,
				type: this.props.type,
				intendeduse: this.props.intendedUse,
			},
			file: {
				$: {
					href: this.getFilePath(),
				},
			},
		};
	}
}
