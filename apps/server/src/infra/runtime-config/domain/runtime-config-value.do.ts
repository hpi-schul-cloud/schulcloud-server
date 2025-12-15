import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { RuntimeConfigValueInvalidTypeLoggable } from './loggable/runtime-config-value-invalid-type.loggable';

export type RuntimeConfigValueProps = RuntimeConfigDefault & AuthorizableObject;

export type RuntimeConfigDefault = {
	key: string;
	description?: string;
} & RuntimeConfigValueAndType;

export type RuntimeConfigValueAndType =
	| { value: string; type: 'string' }
	| { value: number; type: 'number' }
	| { value: boolean; type: 'boolean' };

export type RuntimeConfigValueType = 'string' | 'number' | 'boolean';

export class RuntimeConfigValue extends DomainObject<RuntimeConfigValueProps> {
	public setValue(value: string | number | boolean): RuntimeConfigValue {
		if (this.props.type === 'string' && typeof value === 'string') {
			this.props.value = value;
		} else if (this.props.type === 'number' && typeof value === 'number') {
			this.props.value = value;
		} else if (this.props.type === 'boolean' && typeof value === 'boolean') {
			this.props.value = value;
		} else {
			throw new RuntimeConfigValueInvalidTypeLoggable(value, this);
		}
		return this;
	}

	public setValueFromString(value: string): RuntimeConfigValue {
		if (this.props.type === 'string') {
			this.props.value = value;
		}
		if (this.props.type === 'number') {
			this.props.value = this.toNumber(value);
		}
		if (this.props.type === 'boolean') {
			this.props.value = this.toBoolean(value);
		}
		return this;
	}

	public getKey(): string {
		return this.props.key;
	}

	public getTypeAndValue(): RuntimeConfigValueAndType {
		return { ...this.props };
	}

	public getDescription(): string | undefined {
		return this.props.description;
	}

	private toNumber(value: string): number {
		const number = Number(value);
		if (isNaN(number)) {
			throw new RuntimeConfigValueInvalidTypeLoggable(value, this);
		}
		return number;
	}

	private toBoolean(value: string): boolean {
		if (value === 'true') {
			return true;
		} else if (value === 'false') {
			return false;
		} else {
			throw new RuntimeConfigValueInvalidTypeLoggable(value, this);
		}
	}
}
