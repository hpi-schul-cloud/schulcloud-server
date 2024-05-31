import { CommonCartridgeIntendedUseType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeGuard } from '../../common-cartridge.guard';
import {
	CommonCartridgeWebContentResource,
	CommonCartridgeWebContentResourceProps,
} from '../abstract/common-cartridge-web-content-resource';

export type CommonCartridgeWebContentResourcePropsV110 = CommonCartridgeWebContentResourceProps;

export class CommonCartridgeWebContentResourceV110 extends CommonCartridgeWebContentResource {
	private static readonly SUPPORTED_INTENDED_USES = [
		CommonCartridgeIntendedUseType.LESSON_PLAN,
		CommonCartridgeIntendedUseType.SYLLABUS,
		CommonCartridgeIntendedUseType.UNSPECIFIED,
	];

	constructor(readonly props: CommonCartridgeWebContentResourcePropsV110) {
		super(props);
		CommonCartridgeGuard.checkIntendedUse(
			props.intendedUse,
			CommonCartridgeWebContentResourceV110.SUPPORTED_INTENDED_USES
		);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}
}
