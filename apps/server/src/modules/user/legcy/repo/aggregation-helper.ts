import { ObjectId } from 'bson';
import { UserSearchQuery } from '../interfaces';

const convertToIn = (value) => {
	let list: any[] = [];
	if (Array.isArray(value)) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		list = value;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	} else if (Array.isArray(value.$in)) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
		list = value.$in;
	} else if (typeof value === 'string') {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		list = [value];
	}
	return list;
};

/**
 * Allows to filter a attribute by a value
 * @param {Array} aggregation
 * @param {String} attr - attribute name
 * @param {*} consentStatus - Array, String or Object with a $in
 */
const stageBaseFilter = (aggregation, attr, value) => {
	aggregation.push({
		$match: {
			[attr]: {
				$in: convertToIn(value),
			},
		},
	});
};

/**
 * Convert a "select"-array to an object to handle it with aggregaitons
 * @param {Array} select
 */
const convertSelect = (select) =>
	select.reduce((acc, curr) => {
		return { ...acc, [curr]: 1 };
	}, {});

/**
 * Creates an reducer to filter parent consent
 * @param {string} type - consent type
 */
const getParentReducer = (type) => {
	return {
		$reduce: {
			input: '$consent.parentConsents',
			initialValue: false,
			in: { $or: ['$$value', `$$this.${type}`] },
		},
	};
};

/**
 * To sort by consentStatus, this stage convert the status message to an number.
 * ConsentStatus is needed to use this stage.
 *
 * missing: 0
 * parentsAgreed: 1
 * ok: 2
 *
 * @param {*} aggregation - current aggregation array
 */
const stageAddConsentSortParam = (aggregation) => {
	aggregation.push({
		$addFields: {
			consentSortParam: {
				$switch: {
					branches: [
						{
							case: {
								$eq: ['$consentStatus', 'missing'],
							},
							then: 0,
						},
						{
							case: {
								$eq: ['$consentStatus', 'parentsAgreed'],
							},
							then: 1,
						},
						{
							case: {
								$eq: ['$consentStatus', 'ok'],
							},
							then: 2,
						},
					],
				},
			},
		},
	});
};

const getConsentStatusSwitch = () => {
	const currentDate = new Date();
	const secondLevel = new Date();
	secondLevel.setFullYear(currentDate.getFullYear() - 16); // TODO: get age from default.conf
	const firstLevel = new Date();
	firstLevel.setFullYear(currentDate.getFullYear() - 14);

	return {
		$switch: {
			branches: [
				{
					case: {
						$or: [
							{
								$and: [
									{ $lte: ['$birthday', secondLevel] },
									{ $eq: ['$consent.userConsent.privacyConsent', true] },
									{ $eq: ['$consent.userConsent.termsOfUseConsent', true] },
								],
							},
							{
								$and: [
									{ $gt: ['$birthday', secondLevel] },
									{ $lte: ['$birthday', firstLevel] },
									{ $eq: ['$consent.userConsent.privacyConsent', true] },
									{ $eq: ['$consent.userConsent.termsOfUseConsent', true] },
									{ $eq: [getParentReducer('privacyConsent'), true] },
									{ $eq: [getParentReducer('termsOfUseConsent'), true] },
								],
							},
							{
								$and: [
									{ $gt: ['$birthday', firstLevel] },
									{ $eq: [getParentReducer('privacyConsent'), true] },
									{ $eq: [getParentReducer('termsOfUseConsent'), true] },
								],
							},
						],
					},
					then: 'ok',
				},
				{
					case: {
						$and: [
							{ $gt: ['$birthday', secondLevel] },
							{ $lte: ['$birthday', firstLevel] },
							{ $eq: [getParentReducer('privacyConsent'), true] },
							{ $eq: [getParentReducer('termsOfUseConsent'), true] },
						],
					},
					then: 'parentsAgreed',
				},
			],
			default: 'missing',
		},
	};
};

const stageAddConsentStatus = (aggregation) => {
	aggregation.push({
		$addFields: {
			consentStatus: getConsentStatusSwitch(),
		},
	});
};

/**
 * Convert Select array to and aggregation Project and adds consentStatus if part of select
 *
 * @param {Array} aggregation
 * @param {Array} select
 */
const stageAddSelectProjectWithConsentCreate = (aggregation, select) => {
	const project = convertSelect(select);

	if (select.includes('consentStatus')) {
		project.consentStatus = getConsentStatusSwitch();
	}

	aggregation.push({
		$project: project,
	});
};

/**
 * Only select fields which are in select
 */
const stageSimpleProject = (aggregation, select) => {
	aggregation.push({
		$project: convertSelect(select),
	});
};

const stageLookupClasses = (aggregation, schoolId: ObjectId, schoolYearId: ObjectId) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
	aggregation.push({
		$lookup: {
			from: 'classes',
			let: { id: '$_id' },
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$schoolId', schoolId] },
								{
									$and: [
										{
											$or: [{ $eq: ['$year', schoolYearId] }, { $eq: [{ $type: '$year' }, 'missing'] }],
										},
										{
											$or: [{ $max: '$gradeLevel' }, { $eq: [{ $type: '$gradeLevel' }, 'missing'] }],
										},
									],
								},
								{
									$or: [{ $in: ['$$id', '$userIds'] }, { $in: ['$$id', '$teacherIds'] }],
								},
							],
						},
					},
				},
				{
					$sort: {
						year: -1,
						gradeLevel: -1,
						name: 1,
					},
				},
				{
					$project: {
						gradeLevel: {
							$convert: {
								input: '$gradeLevel',
								to: 'string',
								onNull: '',
							},
						},
						name: {
							$convert: {
								input: '$name',
								to: 'string',
								onNull: '',
							},
						},
					},
				},
			],
			as: 'classes',
		},
	});
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
	aggregation.push({
		$addFields: {
			classesSort: {
				$arrayElemAt: ['$classes', 0],
			},
			classes: {
				$map: {
					input: '$classes',
					as: 'class',
					in: { $concat: ['$$class.gradeLevel', '$$class.name'] },
				},
			},
		},
	});
};

/**
 *	Sorts the output of earlier stage.
 *	To filter by consentStatus, it has to created first
 *
 * @param {Array} aggregation
 * @param {Object} sort
 */
const stageSort = (aggregation, sort) => {
	const mSort = {};
	for (const k in sort) {
		if (k === 'searchQuery') {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mSort.score = { $meta: 'textScore' };
		} else if (k === 'consentStatus') {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
			mSort.consentSortParam = Number(sort[k]);
			stageAddConsentSortParam(aggregation);
		} else if (k === 'classes') {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const order = Number(sort[k]);
			mSort['classesSort.gradeLevel'] = order;
			mSort['classesSort.name'] = order;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		} else if ({}.hasOwnProperty.call(sort, k)) mSort[k] = Number(sort[k]);
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
	aggregation.push({
		$sort: mSort,
	});
};

/**
 *	Convert the output to a feathers-mongoose like format:
 *
 * {
 * 	total: Number,
 * 	limit: Number,
 *  skip: Number,
 *  data: Array
 * }
 *
 * @param {Array} aggregation
 * @param {Int} limit
 * @param {Int} skip
 */
const stageFormatWithTotal = (aggregation, limit, skip) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
	aggregation.push({
		$facet: {
			data: [
				{
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					$skip: skip,
				},
				{
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					$limit: limit,
				},
			],
			total: [
				{
					$count: 'count',
				},
			],
		},
	});

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
	aggregation.push({
		$project: {
			total: {
				$reduce: {
					input: '$total',
					initialValue: 0,
					in: { $add: ['$$value', '$$this.count'] },
				},
			},
			data: 1,
		},
	});

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
	aggregation.push({
		$addFields: {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			limit,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			skip,
		},
	});
};

/**
 * require a amount of quality which reduce the result
 *
 * @param {Array} aggregation
 * @param {Number} amount
 */
const stageFilterSearch = (aggregation, amount) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
	aggregation.push({ $addFields: { score: { $meta: 'textScore' } } });
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
	aggregation.push({ $match: { score: { $gte: amount } } });
};

/**
 * Creates an Array for an Aggregation pipeline and can handle, select, sort, limit, skip and matches.
 * To filter or sort by consentStatus, it has also to be seleceted first.
 *
 * @param {{select: Array, sort: Object, limit: Int, skip: Int, ...matches}} param0
 */
export const createMultiDocumentAggregation = ({
	select,
	sort,
	limit = 25,
	skip = 0,
	consentStatus,
	classes,
	schoolYearId,
	searchQuery,
	searchFilterGate,
	...match
}: UserSearchQuery) => {
	// eslint-disable-next-line no-param-reassign
	limit = Number(limit);
	// eslint-disable-next-line no-param-reassign
	skip = Number(skip);
	if (typeof match._id === 'string') {
		match._id = new ObjectId(match._id);
	} else if (Array.isArray(match._id)) {
		// build "$in" Query
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const convertToObjectIds = (inArray: Array<string>) => inArray.map((id) => new ObjectId(id));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
		match._id = { $in: convertToObjectIds(convertToIn(match._id)) };
	}

	const selectSortDiff = Object.getOwnPropertyNames(sort || {}).filter((s) => !select.includes(s));
	const aggregation = [];

	if (searchQuery) {
		// to sort by this value, add 'searchQuery' to sort value
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		match.$text = {
			$search: searchQuery,
		};
	}

	if (match) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		aggregation.push({
			$match: match,
		});
	}

	if (searchQuery && searchFilterGate) {
		stageFilterSearch(aggregation, searchFilterGate);
	}

	if (select) {
		stageAddSelectProjectWithConsentCreate(aggregation, select.concat(selectSortDiff));
		if (select.includes('classes')) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			stageLookupClasses(aggregation, match.schoolId, schoolYearId);
		}
	} else {
		stageAddConsentStatus(aggregation);
		if (match.schoolId && schoolYearId) stageLookupClasses(aggregation, match.schoolId, schoolYearId);
	}

	if (consentStatus) {
		stageBaseFilter(aggregation, 'consentStatus', consentStatus);
	}

	if (classes) {
		stageBaseFilter(aggregation, 'classes', classes);
	}

	if (sort) {
		stageSort(aggregation, sort);
	}

	stageSimpleProject(aggregation, select);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	if (!match._id || Array.isArray(match._id.$in)) stageFormatWithTotal(aggregation, limit, skip);
	return aggregation;
};
