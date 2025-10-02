import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

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
		// TODO: make this impossible to mess up.
		this.props.value = value;
		return this;
	}
}
