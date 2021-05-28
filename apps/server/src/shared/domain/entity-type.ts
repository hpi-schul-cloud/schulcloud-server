const EntityType = {
	Course: 'course',
	Team: 'team',
	School: 'school',
	News: 'news',
	User: 'user',
} as const;
type ValueOf<T> = T[keyof T];

export type EntityTypeValue = ValueOf<typeof EntityType>;
