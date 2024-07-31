import { ObjectId } from '@mikro-orm/mongodb';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	LtiMessageType,
	LtiPrivacyPermission,
	ToolConfigType,
} from '@modules/tool/common/enum';
import {
	BasicToolConfigEntity,
	CustomParameterEntity,
	ExternalToolEntity,
	ExternalToolEntityProps,
	ExternalToolMediumEntity,
	Lti11ToolConfigEntity,
	Oauth2ToolConfigEntity,
} from '@modules/tool/external-tool/entity';
import { fileRecordFactory } from '@shared/testing';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { DeepPartial } from 'fishery';

export class ExternalToolEntityFactory extends BaseFactory<ExternalToolEntity, ExternalToolEntityProps> {
	withName(name: string): this {
		const params: DeepPartial<ExternalToolEntityProps> = {
			name,
		};
		return this.params(params);
	}

	withBasicConfig(): this {
		const params: DeepPartial<ExternalToolEntityProps> = {
			config: new BasicToolConfigEntity({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
			}),
		};
		return this.params(params);
	}

	withOauth2Config(clientId: string): this {
		const params: DeepPartial<ExternalToolEntityProps> = {
			config: new Oauth2ToolConfigEntity({
				type: ToolConfigType.OAUTH2,
				baseUrl: 'mockBaseUrl',
				clientId,
				skipConsent: false,
			}),
		};
		return this.params(params);
	}

	withLti11Config(): this {
		const params: DeepPartial<ExternalToolEntityProps> = {
			config: new Lti11ToolConfigEntity({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
				key: 'key',
				lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
				secret: 'secret',
				privacy_permission: LtiPrivacyPermission.ANONYMOUS,
				launch_presentation_locale: 'de-DE',
			}),
		};
		return this.params(params);
	}

	withBase64Logo(): this {
		const params: DeepPartial<ExternalToolEntityProps> = {
			logoBase64:
				'iVBORw0KGgoAAAANSUhEUgAAAfQAAADICAYAAAAeGRPoAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQwIDc5LjE2MDQ1MSwgMjAxNy8wNS8wNi0wMTowODoyMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjQ2MUQ2Q0Y5RTQxMTExRTdBMTg3QkQ2MDVGMUFEMUIwIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjQ2MUQ2Q0ZBRTQxMTExRTdBMTg3QkQ2MDVGMUFEMUIwIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NDYxRDZDRjdFNDExMTFFN0ExODdCRDYwNUYxQUQxQjAiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NDYxRDZDRjhFNDExMTFFN0ExODdCRDYwNUYxQUQxQjAiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz45EjsrAAALfUlEQVR42uzdgXWjOAIGYHLvGsiV4CnBU4JTgqeEpIS4hKSEpIS4BLsEu4RJCeMScmhGzPplkyCMAGO+7z3ezs3tYsuS+BEIcfX29lYAAOP2Hz8BAAh0AECgAwACHQAQ6AAg0AEAgQ4ACHQAQKADgEAHAAQ6ACDQAQCBDgACHQAQ6ACAQAcABDoACHQAQKADAAIdABDoACDQAQCBDgAIdABAoAOAQAcABDoAINABAIEOAAIdABDoAIBABwAEOgAIdABAoAMAAh0AEOgAINABAIEOAAh0AECgA4BABwAEOgAg0AEAgQ4ACHQAEOgAgEAHAAQ6ACDQAUCgAwACHQAQ6ACAQAcAgQ4ACHQAQKADAAIdAAQ6ACDQAQCBDgAIdAAQ6ACAQAcABDoAINABQKADAAIdABDoAIBABwCBDgAIdABAoAMAAh0ABDoAINABgN79109AbldXV9flPxblNov/DOblFv7+UG77+HfVn39vb29vB78emdpg1fauP2iDwWvcgm3883aMbbAs6/yorPP414ujf+W4z+2r/12WdasOL6zdl4Ufa4fdvGu0gyp/x6sTyjD0jx8a/03GOgn1cVtuyxN3EQ4267CV3+t16u2jhz701lfb6DEAlnGbt2yDz+ccDDHEq7LOTtzNIZY11PVaHV6AEOhj3ErhgP12LtuJZRj6e28y1cW8g/p4CgeqKbePHvpQ522jp3LMYnvJWWe/2rbBjsq66Kht/wwn4+pw3Jt76LQ9o76NB5jco+Gw35/l/p/iJXx43/auy+2+CqPMu7+O+9zFzziHsj511Nf+Bmr5GT/jlTZ1OEICnbZh/lT8c0+rC1WwL/3ivLvkvCu3h44/KrTth/LzdvFy8BBlXXQUeJ8F+6b8zIeuT6SnVIcCnXM/oC5jmPchdMiXqZxlk3QiuStOv3d8inkc6c0HKOum45Pmj9zHYJ+pQ4HOZR9Qr08I8zBRZRu3U4RJcs9+fWHe44nkRyeWu/gd+ijr04BlrRzU4Xh4bI1T3CaMGMKB4LH4M4N2/0Gnrh5JqWbr1u3vzmNtwrxhEFSzuEP7ez1+TCu2v9lR+2syagv3mvcfteuMZb0vml1ifz0q6/74KZF3Za3Km/Lb/cjd56ZUh4OYyuy/1NnPZhknfe9fNd/9JQR0g/1Vk1d+frK/hym2D+3vX7O7G83YbtgGm86yDn1g1lFZlw3Lumy4/9Df7mv68VwdjrBPC3SBnrlT7lru//2BZtekUwv0y2t/MYB+JR6kH9q0lzjK2yV+1q6jx7dSy3qf4Xe9/2C/t+rQY2tMQ91lrceWV4zCf/8tXmZzqZ2iSH+SIrSVVZv2Ei/BhgV1UuZrzDuYqJlS1upyeNu+doj7+F78s+LaY/l3z+pwnAQ6WQM9x4pT8UDzI3TKi7vHRdN7rovEe753uYIotr+7xEC4zzUTPD45kvIM+E3Old1iH/sew3ylDgU609Hb4zPnvtY0vUgZPd11MaqMgbBP6A+5RngPiWXdd1DWQxdhPsE6FOhc1IjKqm7kHNnVjVjXHV0iroQrRXWXf2/btvtY1tnAZVWHAp2JqesYVnQjl5S2tOryC8THv1LuVbd9rvk2od+t1OFZ16FAZ3TqLl89XPJKTPQ2srtOCIPHtm/lSwyEEAZ1n7PsuKzPfZRVHQp0pqWuU4ROvLnUlZjoTfUe7C9DrsfvU/dZ8xYTq5YZPl8dDluHAp1RSpmo9ntp2Pjmpnv31TlB3VWefc8j1nWG7/yZ2ZmVVR0KdKYgPh+aelYdDlRh5u6vMtQ3MdxdjidHGKx7bvchePYJ7X30ZVWHAp38FmX4vXWwbTJ8t3A/qunCD4sY7uHFCCHgX2LAz1Q1n7SXL0d3A3ynbcvvPKayqsMR8nIWTjrTLYM4zEw99Y1J1WSZsIVJdNWLJdYWkiHREJegD2Mqa3ineZHpEnLZL2/UoUDnckP9uTxgFEWe1yCGUXpY2CGM2EOgP4/teVvySbktM9A95bqTzcUJZV10WNb5UCPOKdXhOXHJnVahXqQt2tD0IFRNqPNM+zSZRKkOEegMEOrhUnl4mcoqc7CHUXu4z/5kljyAQKefUD8cvSUtBHvOS2nhefaNUGcEvBVQHQp0LivYyy0E+++3NxV5ZrKGy/AvfuHJtKPatQ4Gevyx9nnxCyqrOhToZLQtO8VVB9tNTx16H99rHIL9f8Wfe+1tAn5xSe8tpvMDcxeuJ1RWdSjQ4dOR+/oo4MMIPrzWsOnCEladm9AJbc3/P8TobtHyO5/6381O7Hc3qSf6RTcvSJlSHQp0Jhvwr2GGfLn9iKP31Al1KS974DKc1Ys04onkouV3HkVZ1aFAhzaj92pCXcqz55aOnYbaJTp7vgebEj7bjso61peGTKkOBTq8C/a7hFC3VOw0pNyO6fONfnWftY3vOTjF9szKqg4FOmRRdy9v4SeaxgleQiDc9jFyja8C7uxFI4kvDbkd2yh9SnUo0OHzg8DWL0HiAfapyy8Q77vWPV1xKNqHQd2VqfA9HtThWdehQGecQieJZ73Q1cldOMDWTVLq+nHGEKJ1I8jHtpdq4zLKdftYjq3PTakOBTpjFl7D+hTf6JTbV4+meRvbtKQ8TvXQRdCFZYeL+vuuhyJtMmeKx8SyztXh2dahQGd0o/PQSaqDSng2fJPrPljcz1cHrFc1MLlResotmKeco7zEIMg6sotPe9S173Cyu+ngxUVzdSjQmV6Y337QScJEtV2mzlh3P80IfXruirR1CsIo76XN4kPhhDKcoCYGwTaGcO6y1gnle8nR38JoP5Z3qQ4FOtMK88UXgXsdO2N47elt0w4Z78m/FPWz2NdqYnKj9DBqTV3JLARTaIONVhWMIRACclekPUkRwulHB2UNI9nUgPnb307py3EEm1pedTiGY3T5Q08tlDZfVXZcBrGv7zL4j59a3njfblM0Wwv5OY6ow7ru+y/2u4xn03X73na9Fv05tY9Lbn+n/I7xYN10zsa6aoOxHR6qE8jiz2XmamsyQg37uPmsTWeqm5cTvlNV1tfjl6MclbW6nbUoGq7nkKvdT6kOBbpAP+dAv46B3uZe26H455L5rGi+SMz3rjugQD/fQI/fOfW+aFd6CYJM/S2XcI95lbFsk6jDIbjkTuoB+BBfrNLmflO1lnLjEUJpdYkdkMbtMNyLXQ308b0FQRyFhqtRQ86+/n1JOmeYT6kOBTpjOKCu4oGmz9nmz5c0cYXWbfAxtsE+ZyaHS9jf+gyCo+WQhwi/dSzvWh0KdC77gBo6xvci/S1pbaziQQ3et8HUF/q0HdHdxVeRHgYqaxV+fQTRaxzB/ui6vFOqQ4HOuR9Qj9+StupgxL6PBxYjc+pGsDdF/uWCD7Fdf4uruA1+AhNved0V3VwdC79fCPFvxxPq1OG4mBT37wZmUtzp5VnG3zb889TnSMMlvnVXl/rG1D4uuf118TvGRYluY/ubtWh/29gGD2dcdzn62j6W9Tk+VnYO5ZpMHQp0xhQW1aMk1+8Csvrz69FIYxv/vJ1aB6TTYKgmX87ftb3j9lc9eTHa9hf7WlXW2Qdl3cdyjqqsU6pDgQ4A/OUeOgAIdABAoAMAAh0AEOgAINABAIEOAAh0AECgA4BABwAEOgAg0AEAgQ4AAh0AEOgAgEAHAAQ6AAh0AECgAwACHQAQ6AAg0AEAgQ4ACHQAQKADgEAHAAQ6ACDQAQCBDgACHQAQ6ACAQAcABDoACHQAQKADAAIdABDoACDQAQCBDgAIdABAoAOAQAcABDoAINABAIEOAAh0ABDoAIBABwAEOgAg0AFAoAMAAh0AEOgAgEAHAIEOAAh0AECgAwACHQAEOgAg0AEAgQ4ACHQAEOgAgEAHAAQ6ACDQAUCgAwACHQAQ6ACAQAcAgQ4ACHQAQKADAAIdAAQ6ACDQAYD+/V+AAQADXuXS75wQpQAAAABJRU5ErkJggg==',
		};

		return this.params(params);
	}

	withMedium(medium?: ExternalToolMediumEntity): this {
		const params: DeepPartial<ExternalToolEntityProps> = {
			medium: new ExternalToolMediumEntity({
				mediumId: 'mediumId',
				publisher: 'publisher',
				mediaSourceId: 'mediaSourceId',
				...medium,
			}),
		};

		return this.params(params);
	}
}

export const customParameterEntityFactory = BaseFactory.define<CustomParameterEntity, CustomParameterEntity>(
	CustomParameterEntity,
	({ sequence }) => {
		return {
			name: `name${sequence}`,
			displayName: `User Friendly Name ${sequence}`,
			description: 'This is a mock parameter.',
			default: 'default',
			location: CustomParameterLocation.PATH,
			scope: CustomParameterScope.SCHOOL,
			type: CustomParameterType.STRING,
			isOptional: false,
			isProtected: false,
		};
	}
);

export const externalToolEntityFactory = ExternalToolEntityFactory.define(
	ExternalToolEntity,
	({ sequence }): ExternalToolEntityProps => {
		return {
			id: new ObjectId().toHexString(),
			name: `external-tool-${sequence}`,
			description: 'This is a tool description',
			url: '',
			logoUrl: 'https://logourl.com',
			config: new BasicToolConfigEntity({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
			}),
			parameters: [customParameterEntityFactory.build()],
			isHidden: false,
			isDeactivated: false,
			openNewTab: true,
			thumbnail: {
				uploadUrl: 'https://uploadurl.com',
				fileRecord: fileRecordFactory.build(),
			},
		};
	}
);
