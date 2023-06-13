import { IEntity } from './entity';

export interface ICounty extends IEntity {
	antaresKey: string;
	countyId: number;
	name: string;
}
