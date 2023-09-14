export interface ICountyCreate {
	name: string;
	countyId: number;
	antaresKey: string;
}

export interface IFederalStateCreate {
	name: string;
	abbreviation: string;
	logoUrl: string;
	counties?: ICountyCreate[];
}
