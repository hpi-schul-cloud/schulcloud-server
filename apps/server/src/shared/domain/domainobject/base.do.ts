export abstract class BaseDO {
	id?: string;
}

export abstract class BaseWithTimestampsDO extends BaseDO {
	id?: string;

	createdAt?: Date;

	updatedAt?: Date;
}
