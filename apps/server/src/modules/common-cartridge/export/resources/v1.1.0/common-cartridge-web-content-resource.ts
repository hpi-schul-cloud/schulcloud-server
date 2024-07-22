import {
	CommonCartridgeElementType,
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { CommonCartridgeGuard } from '../../common-cartridge.guard';
import { ElementTypeNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeResource, XmlObject } from '../../interfaces';
import { createIdentifier } from '../../utils';

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

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
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

	public getFilePath(): string {
		return `${this.props.folder}/${this.props.identifier}.html`;
	}

	public getFileContent(): string {
		return this.props.html;
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
