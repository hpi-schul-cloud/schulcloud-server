import { ObjectID } from 'bson';
import { v4 } from 'uuid';
import { BaseDO2, BaseDOProps } from './base.do';

// static?
export abstract class BaseDOFactory<Properties extends BaseDOProps, T extends BaseDO2<Properties>> {
	// constructor(private DoConstructor: { new (): T }) {}
	// protected static singelton: BaseDOFactory<Properties, T>;

	// public static getInstance(): BaseDOFactory<Properties, T>;

	protected createId() {
		const id = new ObjectID().toHexString();

		return id;
	}

	protected createUUID(): string {
		const uuid = v4();

		return uuid;
	}

	abstract build(props: Properties): T;
	/*
	protected assignProps(props: Properties): Properties & BaseDOProps {
		const id = this.createId();
		const assignProps = Object.assign(props, { id });

		return assignProps;
	}
	*/

	// public buildFromEntity(props: Properties & BaseDOProps) {} TODO: check how it can work with build

	/**
	public build2(props: Properties): T {
		const domainObject = new this.DoConstructor(props);

		return domainObject;
	}
	 */
}
