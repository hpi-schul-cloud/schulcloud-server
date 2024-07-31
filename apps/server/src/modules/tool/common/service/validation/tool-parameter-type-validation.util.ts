import { isNaN } from 'lodash';
import { CustomParameterType } from '../../enum';

export class ToolParameterTypeValidationUtil {
	private static typeCheckers: { [key in CustomParameterType]: (val: string) => boolean } = {
		[CustomParameterType.STRING]: () => true,
		[CustomParameterType.NUMBER]: (val: string) => !isNaN(Number(val)),
		[CustomParameterType.BOOLEAN]: (val: string) => val === 'true' || val === 'false',
		[CustomParameterType.AUTO_CONTEXTID]: () => false,
		[CustomParameterType.AUTO_CONTEXTNAME]: () => false,
		[CustomParameterType.AUTO_SCHOOLID]: () => false,
		[CustomParameterType.AUTO_SCHOOLNUMBER]: () => false,
		[CustomParameterType.AUTO_MEDIUMID]: () => false,
		[CustomParameterType.AUTO_MOINSCHULE_GROUPUUID]: () => false,
	};

	public static isValueValidForType(type: CustomParameterType, val: string): boolean {
		const rule = this.typeCheckers[type];

		const isValid: boolean = rule(val);

		return isValid;
	}
}
