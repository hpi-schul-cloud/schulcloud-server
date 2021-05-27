import { Transform } from 'class-transformer';

export function ToBoolean() {
	return Transform((p) => {
		const str = p.obj[p.key];
		if (['1', 'true'].includes(str)) {
			return true;
		} else if (['0', 'false'].includes(str)) {
			return false;
		}
		return p;
	});
}
