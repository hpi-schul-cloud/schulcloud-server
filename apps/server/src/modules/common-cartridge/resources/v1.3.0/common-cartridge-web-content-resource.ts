import {
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { CommonCartridgeResource } from '../../interfaces/common-cartridge-resource.interface';
import { checkIntendedUse } from '../../utils';

export type CommonCartridgeWebContentResourcePropsV130 = {
	type: CommonCartridgeResourceType.WEB_CONTENT;
	version: CommonCartridgeVersion;
	identifier: string;
	folder: string;
	title: string;
	html: string;
	intendedUse: CommonCartridgeIntendedUseType;
};

export class CommonCartridgeWebContentResourceV130 extends CommonCartridgeResource {
	private static readonly SUPPORTED_INTENDED_USES = [
		CommonCartridgeIntendedUseType.ASSIGNMENT,
		CommonCartridgeIntendedUseType.LESSON_PLAN,
		CommonCartridgeIntendedUseType.SYLLABUS,
		CommonCartridgeIntendedUseType.UNSPECIFIED,
	];

	constructor(private readonly props: CommonCartridgeWebContentResourcePropsV130) {
		super(props);
		checkIntendedUse(props.intendedUse, CommonCartridgeWebContentResourceV130.SUPPORTED_INTENDED_USES);
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
		return CommonCartridgeVersion.V_1_3_0;
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
