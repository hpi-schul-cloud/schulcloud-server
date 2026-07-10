/**
 * @deprecated
 */
export abstract class BaseDO {
	public id?: string;

	protected constructor(id?: string) {
		this.id = id;
	}
}
