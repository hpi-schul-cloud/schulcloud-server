import { ObjectID } from 'bson';
import { v4 } from 'uuid';
import { BaseDO2, BaseDOProps } from './base.do';

// static?
export abstract class BaseDOFactory<Properties extends BaseDOProps, T extends BaseDO2<Properties>> {
	// constructor(private DoConstructor: { new (): T }) {}

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

export abstract class BaseDOTestFactory<Properties extends BaseDOProps, T extends BaseDO2<Properties>> {
	// constructor(private DoConstructor: { new (): T }) {}
	// https://stackoverflow.com/questions/37482342/typescript-pass-generic-type-as-parameter-in-generic-class

	protected createId() {
		const id = new ObjectID().toHexString();

		return id;
	}

	protected createUUID(): string {
		const uuid = v4();

		return uuid;
	}

	abstract build(partialProps: Partial<Properties>): T;

	abstract defaultProps(): Properties;

	public buildList(number = 1, partialProps: Partial<Properties> = {}): T[] {
		// TODO: check if Array(number).map work like expected
		const fileRecords = Array(number).map(() => this.build(partialProps));

		return fileRecords;
	}

	protected assign<P extends BaseDOProps>(defaultProps: P, props: Partial<P>): P {
		const mergedProps = Object.assign(defaultProps, props);

		return mergedProps;
	}

	/** nice if it can be placed her

	public build(partialProps: Partial<Properties>): T {
		const baseProps = this.defaultProps();
		const props = this.assign(baseProps, partialProps);
		const fileRecord = this.build(props);
	};

	*/
}

/*
export abstract class BaseDOTestFactory<
	Properties extends BaseDOProps,
	T extends BaseDO2<Properties>
> extends BaseDOFactory<Properties, T> {
	public buildList(number = 1, partialProps: Partial<Properties> = {}): T[] {
		// TODO: check if Array(number).map work like expected
		const fileRecords = Array(number).map(() => this.build(partialProps));

		return fileRecords;
	}
}
*/
/*
export abstract class BaseDOTestFactory<BaseDOFactory> {
	constructor(private factory: { new (): BaseDOFactory }) {}

	public buildList(number = 1, partialProps: Partial<Properties> = {}): FileRecord[] {
		// TODO: check if Array(number).map work like expected
		const fileRecords = Array(number).map(() => this.factory.build(partialProps));

		return fileRecords;
	}
}
*/
