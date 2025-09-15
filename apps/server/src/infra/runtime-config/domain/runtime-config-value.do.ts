import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export type RuntimeConfigValueProps = {
	key: string;
	description?: string;
} & RuntimeConfigValueAndType &
	AuthorizableObject;

export type RuntimeConfigValueAndType =
	| { value: string; type: 'string' }
	| { value: number; type: 'number' }
	| { value: boolean; type: 'boolean' };

export type RuntimeConfigValueType = 'string' | 'number' | 'boolean';

export class RuntimeConfigValue extends DomainObject<RuntimeConfigValueProps> {}
