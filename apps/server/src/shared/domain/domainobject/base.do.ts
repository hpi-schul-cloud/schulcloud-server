export abstract class BaseDO {
	id?: string;

	protected constructor(id?: string) {
		this.id = id;
	}
}

export abstract class BaseWithTimestampsDO extends BaseDO {
	id?: string;

	createdAt?: Date;

	updatedAt?: Date;

	protected constructor(props: BaseWithTimestampsDO) {
		super();
		this.id = props.id;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}
}

export interface IBaseEntityProps {
	id?: string;
}
