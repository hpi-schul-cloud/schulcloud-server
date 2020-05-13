/**
 * Convert a select array to an object for aggregaitons
 * @param {Array} select
 */
const convertSelect = (select) => {
	const project = {};

	select.forEach((e) => {
		project[e] = 1;
	});

	return project;
};

/**
 * Creates an reducer to filter parent consent
 * @param {string} type - consent type
 */
const getParentReducer = (type) => ({
	$reduce: {
		input: '$consent.parentConsents',
		initialValue: false,
		in: { $or: ['$$value', `$$this.${type}`] },

	},
});

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


/**
 * Seperate match stage to filter by consentService.
 * It could only called after consentStatus was add
 * @param {*} aggregation
 * @param {*} consentStatus
 */
const stageFilterByConsentStatus = (aggregation, consentStatus) => {
	let list = [];
	if (Array.isArray(consentStatus)) {
		list = consentStatus;
	} else if (Array.isArray(consentStatus.$in)) {
		list = consentStatus.$in;
	} else if (typeof consentStatus === 'string') {
		list = [consentStatus];
	}
	aggregation.push({
		$match: {
			consentStatus: {
				$in: list,
			},
		},
	});
};

const stageLookupClasses = (aggregation, schoolId, schoolYearId) => {
	aggregation.push({
		$lookup:
		{
			from: 'classes',
			let: { id: '$_id' },
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$schoolId', schoolId] },
								{
									$or: [
										{ year: schoolYearId },
										{ year: { $exists: false } },
									],
								},
								{
									$or: [
										{ $in: ['$$id', '$userIds'] },
										{ $in: ['$$id', '$teacherIds'] },
									],
								},
							],
						},
					},
				},
				{ $project: { displayName: 1 } },
			],
			as: 'classes',
		},
	});
	aggregation.push({
		$project: {
			classes: {
				$map: {
					input: '$classes',
					as: 'class',
					in: '$$class.displayName',
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
		if (({}).hasOwnProperty.call(sort, k)) mSort[k] = Number(sort[k]);
	}

	if (typeof sort === 'object' && ({}).hasOwnProperty.call(sort, 'consentStatus')) {
		mSort.consentSortParam = sort.consentStatus;
		delete mSort.consentStatus;
		stageAddConsentSortParam(aggregation);
	}
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
	aggregation.push({
		$facet: {
			data: [
				{
					$skip: skip,
				},
				{
					$limit: limit,
				},
			],
			total: [{
				$count: 'count',
			}],
		},
	});

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

	aggregation.push({
		$addFields: {
			limit,
			skip,
		},
	});
};

/**
 * Creates an Array for an Aggregation pipeline and can handle, select, sort, limit, skip and matches.
 * To filter or sort by consentStatus, it have also to be seleceted first.
 *
 * @param {{select: Array, sort: Object, limit: Int, skip: Int, ...matches}} param0
 */
const createMultiDocumentAggregation = ({
	select, sort, limit = 25, skip = 0, consentStatus, ...match
}) => {
	// eslint-disable-next-line no-param-reassign
	limit = Number(limit);
	// eslint-disable-next-line no-param-reassign
	skip = Number(skip);

	const selectSortDiff = Object.getOwnPropertyNames(sort).filter((s) => !select.includes(s));
	const aggregation = [];

	if (match) {
		aggregation.push({
			$match: match,
		});
	}

	if (select) {
		stageAddSelectProjectWithConsentCreate(aggregation, select.concat(selectSortDiff));
		if (select.includes('classes')) stageLookupClasses(aggregation, match.schoolId, match.schoolYearId);
	} else {
		stageAddConsentStatus(aggregation);
		if (match.schoolId && match.schoolYearId) stageLookupClasses(aggregation, match.schoolId, match.schoolYearId);
	}


	if (consentStatus) {
		stageFilterByConsentStatus(aggregation, consentStatus);
	}


	if (sort) {
		stageSort(aggregation, sort);
	}

	if (selectSortDiff.length !== 0) {
		stageSimpleProject(aggregation, select);
	}

	stageFormatWithTotal(aggregation, limit, skip);

	return aggregation;
};


module.exports = {
	convertSelect,
	getParentReducer,
	createMultiDocumentAggregation,
};
