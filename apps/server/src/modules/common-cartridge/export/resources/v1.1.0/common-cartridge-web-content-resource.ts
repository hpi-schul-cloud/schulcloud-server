import {
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { CommonCartridgeGuard } from '../../common-cartridge.guard';
import { CommonCartridgeResource } from '../../interfaces';

export type CommonCartridgeWebContentResourcePropsV110 = {
	type: CommonCartridgeResourceType.WEB_CONTENT;
	version: CommonCartridgeVersion;
	identifier: string;
	folder: string;
	title: string;
	html: string;
	intendedUse: CommonCartridgeIntendedUseType;
};

export class CommonCartridgeWebContentResourceV110 extends CommonCartridgeResource {
	private static readonly SUPPORTED_INTENDED_USES = [
		CommonCartridgeIntendedUseType.LESSON_PLAN,
		CommonCartridgeIntendedUseType.SYLLABUS,
		CommonCartridgeIntendedUseType.UNSPECIFIED,
	];

	constructor(private readonly props: CommonCartridgeWebContentResourcePropsV110) {
		super(props);
		CommonCartridgeGuard.checkIntendedUse(
			props.intendedUse,
			CommonCartridgeWebContentResourceV110.SUPPORTED_INTENDED_USES
		);
	}

	public canInline(): boolean {
		return false;
	}

	public getFilePath(): string {
		return `${this.props.folder}/${this.props.identifier}.html`;
	}

	public getFileContent(): string {
		return this.props.html;
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public getManifestXmlObject(): Record<string, unknown> {
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
