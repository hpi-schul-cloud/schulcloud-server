import { BoardNodeType } from '@shared/domain/entity';
import type { AnyBoardNodeProps, BoardNodeProps, CardProps, ColumnProps, ColumnBoardProps } from '../domain';

// omit all given keys from an object type
type StrictOmit<T, K extends keyof T> = Omit<T, K>;

// make all value types of an object to be potentially undefined
type MakeNullable<T> = {
	[P in keyof T]: T[P] | undefined;
};

// The properties that extend the base BoardNodeProps with specific BoardNodeType removed
type ExtraProps<T extends AnyBoardNodeProps> = StrictOmit<T, keyof BoardNodeProps | 'type'>;

// We use Required<> utility type to make optional properties non-optional
type ComponentProps<T extends AnyBoardNodeProps> = MakeNullable<Required<ExtraProps<T>>>;

// re-add general BoardNodeType
type TypeProps = { type: BoardNodeType };

export interface BoardNodeEntityProps
	extends BoardNodeProps,
		TypeProps,
		ComponentProps<ColumnBoardProps>,
		ComponentProps<ColumnProps>,
		ComponentProps<CardProps> {}
