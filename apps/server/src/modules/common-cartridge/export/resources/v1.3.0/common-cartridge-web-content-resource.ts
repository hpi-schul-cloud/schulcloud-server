import { CommonCartridgeIntendedUseType, CommonCartridgeVersion } from '@modules/common-cartridge';
import { CommonCartridgeGuard } from '../../common-cartridge.guard';
import {
	CommonCartridgeWebContentResource,
	CommonCartridgeWebContentResourceProps,
} from '../abstract/common-cartridge-web-content-resource';

export type CommonCartridgeWebContentResourcePropsV130 = CommonCartridgeWebContentResourceProps;

export class CommonCartridgeWebContentResourceV130 extends CommonCartridgeWebContentResource {
	private static readonly SUPPORTED_INTENDED_USES = [
		CommonCartridgeIntendedUseType.ASSIGNMENT,
		CommonCartridgeIntendedUseType.LESSON_PLAN,
		CommonCartridgeIntendedUseType.SYLLABUS,
		CommonCartridgeIntendedUseType.UNSPECIFIED,
	];

	constructor(readonly props: CommonCartridgeWebContentResourcePropsV130) {
		super(props);
		CommonCartridgeGuard.checkIntendedUse(
			props.intendedUse,
			CommonCartridgeWebContentResourceV130.SUPPORTED_INTENDED_USES
		);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}
}
