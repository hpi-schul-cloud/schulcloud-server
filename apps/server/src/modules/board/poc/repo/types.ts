import type { AnyBoardNodeProps, BoardNodeProps, CardProps, ColumnProps, ColumnBoardProps } from '../domain';

// omit all given keys from an object type
type StrictOmit<T, K extends keyof T> = Omit<T, K>;

// make all value types of an object to be potentially undefined
type MakeNullable<T> = {
	[P in keyof T]: T[P] | undefined;
};

// The properties that extend the base BoardNodeProps
type ExtraProps<T extends AnyBoardNodeProps> = StrictOmit<T, keyof BoardNodeProps>;

// We use Required<> utility type to make optional properties non-optional
type ComponentProps<T extends AnyBoardNodeProps> = MakeNullable<Required<ExtraProps<T>>>;

export interface BoardNodeEntityProps
	extends BoardNodeProps,
		ComponentProps<ColumnBoardProps>,
		ComponentProps<ColumnProps>,
		ComponentProps<CardProps> {}
