/**
 * @deprecated
 */
export abstract class BaseDO {
	id?: string;

	protected constructor(id?: string) {
		this.id = id;
	}
}
