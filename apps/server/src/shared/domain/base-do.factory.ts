import { ObjectID } from 'bson';
import { v4 } from 'uuid';
import { BaseDO2, BaseDOProps } from './base.do';

export abstract class BaseDOFactory<Properties extends BaseDOProps, T extends BaseDO2<Properties>> {
	protected createId() {
		const id = new ObjectID().toHexString();

		return id;
	}

	protected createUuid(): string {
		const uuid = v4();

		return uuid;
	}
	/*
	protected createDate(): Date {
		const date = new Date();

		return date;
	}
	*/
	abstract build(props: Properties): T;
}
