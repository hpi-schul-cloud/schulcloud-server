import { ISchoolYearProperties } from '@shared/domain';
import { schoolYearFactory } from '@shared/testing/factory/schoolyear.factory';
import { DeepPartial } from 'fishery';

type SeedSchoolYearProperties = Pick<ISchoolYearProperties, 'name'> & {
	id: string;
	endDate: string;
	startDate: string;
};

const seedSchoolYears: SeedSchoolYearProperties[] = [
	{
		id: '5b7de0021a3a07c20a1c165d',
		name: '2017/18',
		endDate: '2018-07-29T22:00:00Z',
		startDate: '2017-08-31T22:00:00Z',
	},
	{
		id: '5b7de0021a3a07c20a1c165e',
		name: '2018/19',
		endDate: '2019-06-29T22:00:00Z',
		startDate: '2018-07-31T22:00:00Z',
	},
	{
		id: '5d2ee323d14ce9844e33f51e',
		name: '2019/20',
		endDate: '2020-07-31T00:00:00Z',
		startDate: '2019-08-01T00:00:00Z',
	},
	{
		id: '5d44297075e1502c27e405e2',
		name: '2020/21',
		endDate: '2021-07-31T00:00:00Z',
		startDate: '2020-08-01T00:00:00Z',
	},
	{
		id: '5ebd6dc14a431f75ec9a3e77',
		name: '2021/22',
		endDate: '2022-07-31T00:00:00Z',
		startDate: '2021-08-01T00:00:00Z',
	},
	{
		id: '5ebd6dc14a431f75ec9a3e78',
		name: '2022/23',
		endDate: '2023-07-31T00:00:00Z',
		startDate: '2022-08-01T00:00:00Z',
	},
	{
		id: '5ebd6dc14a431f75ec9a3e79',
		name: '2023/24',
		endDate: '2024-07-31T00:00:00Z',
		startDate: '2023-08-01T00:00:00Z',
	},
	{
		id: '5ebd6dc14a431f75ec9a3e7a',
		name: '2024/25',
		endDate: '2025-07-31T00:00:00Z',
		startDate: '2024-08-01T00:00:00Z',
	},
	{
		id: '5ebd6dc14a431f75ec9a3e7b',
		name: '2025/26',
		endDate: '2026-07-31T00:00:00Z',
		startDate: '2025-08-01T00:00:00Z',
	},
];

export function generateSchoolYears() {
	return seedSchoolYears.map((year) => {
		const params: DeepPartial<ISchoolYearProperties> = {
			endDate: new Date(year.endDate),
			name: year.name,
			startDate: new Date(year.startDate),
		};
		return schoolYearFactory.buildWithId(params, year.id);
	});
}
