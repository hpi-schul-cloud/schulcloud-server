import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { ArixR } from '../type/arix-r';

export class ArixRecordResponse {
	@ApiProperty({
		description: 'A arix media record',
		example: {
			f: [
				{
					value: 5552796,
					n: 'nr',
				},
				{
					value: 'xmedienlb-5552796',
					n: 'identifier',
				},
				{
					value: 927246,
					n: 'antaresid',
				},
				{
					value: 148548909,
					n: 'uniqint',
				},
				{
					value: '4274493, 4662219',
					n: 'paranr',
				},
				{
					value: 'D',
					n: 'prodland',
				},
				{
					value: 'MedienLB (Starnberg), a.pictures (Hamburg)',
					n: 'produ',
				},
				{
					value: 2009,
					n: 'prodjahr',
				},
				{
					value: 'A(8-13); Q',
					n: 'adressat',
				},
				{
					value: 'Lehr',
					n: 'fsk',
				},
				{
					value: 0,
					n: 'vorfrecht',
				},
				{
					value: '0000-00-00',
					n: 'vorfbis',
				},
				{
					value: 'de',
					n: 'sprache',
				},
				{
					value: 'Basiswissen Politik',
					n: 'titel',
				},
				{
					value: 'Demokratie in Deutschland',
					n: 'utitel',
				},
				{
					value: 'BASISWISSEN POLITIK',
					n: 'sorttitel',
				},
				{
					value: '68002, 48002',
					n: 'geb',
				},
				{
					value: 'Demokratie, Gesetzgebung, Parlament, Politik, Wahl',
					n: 'schlag',
				},
				{
					br: '',
					value:
						'Politik spielt sich nicht nur auf großem Parkett ab, sondern beginnt schon im Kleinen, z. B. in der Schule. Das politische System in Deutschland fußt auf den Grundsätzen der Demokratie. Das bedeutet, dass es in Deutschland freie Wahlen gibt, ein unabhängiges Parlament und eine Gewaltenteilung, die voneinander unabhängig agiert. Zur Demokratie gehört auch, dass jeder deutsche Staatsbürger ab 18 Jahren die Partei wählen kann, die er favorisiert. Auch in der Schule gibt es jährlich demokratische Wahlen, nämlich die der Klassensprecher/-innen. Genau wie Politiker für das Volk, nehmen die gewählten Klassenvertreter Aufgaben für die restlichen Schüler wahr. Dieses Medium erläutert, was Politik bedeutet - im Kleinen wie im Großen und erklärt die wichtigsten Basisbegriffe.Zusatzmaterial: Sprechertexte; Arbeitsblätter; Interaktive Arbeitsblätter; Testaufgaben; Farbfolien; Ergänzendes Material; Internet-Links und Hinweise; Glossar.',
					n: 'text',
				},
				{
					value: 55,
					n: 'typ',
				},
				{
					value: 'ca. 20 min f',
					n: 'laenge',
				},
				{
					value: '7550158 Basiswissen Politik',
					n: 'kontextmedien',
				},
				{
					value: '0000-00-00',
					n: 'verfanf',
				},
				{
					value: '0000-00-00',
					n: 'verfende',
				},
				{
					value: '0000-00-00',
					n: 'empfende',
				},
				{
					value: 'MedienLB (Starnberg)',
					n: 'fremdvertrieb',
				},
				{
					value: 49,
					n: 'erschliesser',
				},
				{
					value: 33,
					n: 'erschlstatus',
				},
				{
					value: '2014-08-20 13:24:34',
					n: 'aenderung',
				},
				{
					value: 'wuerdinger',
					n: 'zustaendigkeit',
				},
				{
					value: '4274493 Basiswissen Politik (de)',
					n: 'sprachfassungen',
				},
				{
					value: 'bw',
					n: 'context',
				},
				{
					value: 'AGBS08 AGBS09 AGBS10 AGBS11 AGBS12 AGBS13 QSADR',
					n: 'searchadressat',
				},
				{
					value: '2023-05-02',
					n: 'datum',
				},
				{
					value: 0,
					n: 'altarchiv',
				},
				{
					value: 0,
					n: 'gebuehr',
				},
				{
					value: 1,
					n: 'sperrung',
				},
				{
					value: '4274493, 4662219',
					n: 'dezentralnr',
				},
				{
					value: 262,
					n: 'icontext',
				},
				{
					value: 'film',
					n: 'lizinfo',
				},
				{
					value: '2099-12-31',
					n: 'licence',
				},
			],
		},
	})
	record!: ArixR;

	@IsOptional()
	@ApiPropertyOptional({ description: 'Error message' })
	error?: string;
}
