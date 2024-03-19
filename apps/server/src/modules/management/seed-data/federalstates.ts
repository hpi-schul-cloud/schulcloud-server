import { CountyEmbeddable, FederalStateProperties } from '@shared/domain/entity/federal-state.entity';
import { federalStateFactory } from '@shared/testing/factory/federal-state.factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeepPartial } from 'fishery';

type SeedFederalStateProperties = Omit<FederalStateProperties, 'counties' | 'createdAt' | 'updatedAt'> & {
	id: string;
	counties?: CountyEmbeddable[];
	createdAt?: string;
	updatedAt?: string;
};

export enum EFederalState {
	BADEN_WUERTTEMBERG = 'Baden-Württemberg',
	BAYERN = 'Bayern',
	BERLIN = 'Berlin',
	BRANDENBURG = 'Brandenburg',
	BREMEN = 'Bremen',
	HAMBURG = 'Hamburg',
	HESSEN = 'Hessen',
	MECKLENBURG_VORPOMMERN = 'Mecklenburg-Vorpommern',
	NIEDERSACHSEN = 'Niedersachsen',
	NORDRHEIN_WESTFALEN = 'Nordrhein-Westfalen',
	RHEINLAND_PFALZ = 'Rheinland-Pfalz',
	SAARLAND = 'Saarland',
	SACHSEN = 'Sachsen',
	SACHSEN_ANHALT = 'Sachsen-Anhalt',
	SCHLESWIG_HOLSTEIN = 'Schleswig-Holstein',
	THUERINGEN = 'Thüringen',
	INTERNATIONAL_SCHOOL = 'Internationale Schule',
}

const seedFederalStates: SeedFederalStateProperties[] = [
	{
		id: '0000b186816abba584714c50',
		name: 'Baden-Württemberg',
		abbreviation: 'BW',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Coat_of_arms_of_Baden-W%C3%BCrttemberg_%28lesser%29.svg/430px-Coat_of_arms_of_Baden-W%C3%BCrttemberg_%28lesser%29.svg.png',
		counties: [
			{
				antaresKey: 'S',
				countyId: 8111,
				name: 'Stuttgart',
				_id: new ObjectId('5fa55eb53f472a2d986c87ba'),
			},
			{
				antaresKey: 'BB',
				countyId: 8115,
				name: 'Böblingen',
				_id: new ObjectId('5fa55eb53f472a2d986c87bb'),
			},
			{
				antaresKey: 'ES',
				countyId: 8116,
				name: 'Esslingen',
				_id: new ObjectId('5fa55eb53f472a2d986c87bc'),
			},
		],
	},
	{
		id: '0000b186816abba584714c51',
		name: 'Bayern',
		abbreviation: 'BY',
		logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Bayern_Wappen.svg/292px-Bayern_Wappen.svg.png',
		counties: [
			{
				antaresKey: 'BRB',
				_id: new ObjectId('5fa55eb53f472a2d986c8812'),
				countyId: 12051,
				name: 'Brandenburg an der Havel',
			},
			{
				antaresKey: 'CB',
				_id: new ObjectId('5fa55eb53f472a2d986c8813'),
				countyId: 12052,
				name: 'Cottbus',
			},
		],
	},
	{
		id: '0000b186816abba584714c52',
		name: 'Berlin',
		abbreviation: 'BE',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Coat_of_arms_of_Berlin.svg/450px-Coat_of_arms_of_Berlin.svg.png',
	},
	{
		id: '0000b186816abba584714c53',
		name: 'Brandenburg',
		abbreviation: 'BB',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Brandenburg_Wappen.svg/354px-Brandenburg_Wappen.svg.png',
		counties: [
			{
				antaresKey: 'BRB',
				countyId: 12051,
				name: 'Brandenburg an der Havel',
				_id: new ObjectId('5fa55eb53f472a2d986c8812'),
			},
			{
				antaresKey: 'CB',
				countyId: 12052,
				name: 'Cottbus',
				_id: new ObjectId('5fa55eb53f472a2d986c8813'),
			},
		],
	},
	{
		id: '0000b186816abba584714c54',
		name: 'Bremen',
		abbreviation: 'HB',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Bremen_Wappen%28Mittel%29.svg/500px-Bremen_Wappen%28Mittel%29.svg.png',
	},
	{
		id: '0000b186816abba584714c55',
		name: 'Hamburg',
		abbreviation: 'HH',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Coat_of_arms_of_Hamburg.svg/225px-Coat_of_arms_of_Hamburg.svg.png',
	},
	{
		id: '0000b186816abba584714c56',
		name: 'Hessen',
		abbreviation: 'HE',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Coat_of_arms_of_Hesse.svg/428px-Coat_of_arms_of_Hesse.svg.png',
	},
	{
		id: '0000b186816abba584714c57',
		name: 'Mecklenburg-Vorpommern',
		abbreviation: 'MV',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Coat_of_arms_of_Mecklenburg-Western_Pomerania_%28great%29.svg/507px-Coat_of_arms_of_Mecklenburg-Western_Pomerania_%28great%29.svg.png',
	},
	{
		id: '0000b186816abba584714c58',
		name: 'Niedersachsen',
		abbreviation: 'NI',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Coat_of_arms_of_Lower_Saxony.svg/593px-Coat_of_arms_of_Lower_Saxony.svg.png',
		counties: [
			{
				antaresKey: 'NI',
				countyId: 3256,
				name: 'Nienburg/Weser',
				_id: new ObjectId('5fa55eb53f472a2d986c8812'),
			},
		],
	},
	{
		id: '0000b186816abba584714c59',
		name: 'Nordrhein-Westfalen',
		abbreviation: 'NW',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Coat_of_arms_of_North_Rhine-Westfalia.svg/462px-Coat_of_arms_of_North_Rhine-Westfalia.svg.png',
	},
	{
		id: '0000b186816abba584714c60',
		name: 'Rheinland-Pfalz',
		abbreviation: 'RP',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Coat_of_arms_of_Rhineland-Palatinate.svg/600px-Coat_of_arms_of_Rhineland-Palatinate.svg.png',
	},
	{
		id: '0000b186816abba584714c61',
		name: 'Saarland',
		abbreviation: 'SL',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Wappen_des_Saarlands.svg/512px-Wappen_des_Saarlands.svg.png',
	},
	{
		id: '0000b186816abba584714c62',
		name: 'Sachsen',
		abbreviation: 'SN',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Coat_of_arms_of_Saxony.svg/512px-Coat_of_arms_of_Saxony.svg.png',
	},
	{
		id: '0000b186816abba584714c63',
		name: 'Sachsen-Anhalt',
		abbreviation: 'ST',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Wappen_Sachsen-Anhalt.svg/554px-Wappen_Sachsen-Anhalt.svg.png',
	},
	{
		id: '0000b186816abba584714c64',
		name: 'Schleswig-Holstein',
		abbreviation: 'SH',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/DEU_Schleswig-Holstein_COA.svg/402px-DEU_Schleswig-Holstein_COA.svg.png',
	},
	{
		id: '0000b186816abba584714c65',
		name: 'Thüringen',
		abbreviation: 'TH',
		logoUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Coat_of_arms_of_Thuringia.svg/512px-Coat_of_arms_of_Thuringia.svg.png',
	},
	{
		id: '5f058f43174c832714864f96',
		name: 'Internationale Schule',
		abbreviation: 'IN',
		logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Earth_icon_2.png/512px-Earth_icon_2.png',
		createdAt: '2020-07-08T09:17:55.124Z',
		updatedAt: '2020-07-08T09:17:55.124Z',
	},
];

export function generateFederalStates() {
	return seedFederalStates.map((federalState) => {
		const counties: CountyEmbeddable[] =
			federalState.counties?.map(
				(county) =>
					new CountyEmbeddable({
						_id: county._id,
						antaresKey: county.antaresKey,
						name: county.name,
						countyId: county.countyId,
					})
			) ?? [];

		const params: DeepPartial<FederalStateProperties> = {
			counties,
			name: federalState.name,
			abbreviation: federalState.abbreviation,
			logoUrl: federalState.logoUrl,
		};
		return federalStateFactory.buildWithId(params, federalState.id);
	});
}
