/* eslint-disable no-param-reassign */

const { Forbidden, GeneralError, NotFound, BadRequest, TypeError } = require('../errors');
const { authenticate } = require('@feathersjs/authentication');

const { v4: uuidv4 } = require('uuid');

const { Configuration } = require('@hpi-schul-cloud/commons');
const _ = require('lodash');
const mongoose = require('mongoose');
const { equal: equalIds } = require('../helper/compare').ObjectId;

const logger = require('../logger');
const { MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE, NODE_ENV, ENVIRONMENTS } = require('../../config/globals');
const { isDisposableEmail } = require('../utils/disposableEmail');
const { getRestrictPopulatesHook, preventPopulate } = require('./restrictPopulate');
const { transformToDataTransferObject } = require('./transformToDataTransferObject');
// Add any common hooks you want to share across services in here.

exports.preventPopulate = preventPopulate;
exports.getRestrictPopulatesHook = getRestrictPopulatesHook;
exports.transformToDataTransferObject = transformToDataTransferObject;

// don't require authentication for internal requests
exports.ifNotLocal = function ifNotLocal(hookForRemoteRequests) {
    return (context) => {
        // meaning it's a local call and pass it without execute hookForRemoteRequests
        if (typeof context.params.provider==='undefined') {
            return context;
        }
        return hookForRemoteRequests.call(this, context);
    };
};

exports.forceHookResolve = (forcedHook) => (context) => {
    forcedHook(context)
            .then(() => Promise.resolve(context))
            .catch(() => Promise.resolve(context));
};

exports.isAdmin = () => (context) => {
    if (!(context.params.user.permissions || []).includes('ADMIN')) {
        throw new Forbidden('you are not an administrator');
    }

    return Promise.resolve(context);
};

exports.isSuperHero = () => (context) => {
    const userService = context.app.service('/users/');
    return userService.find({
        query: {
            _id: context.params.account.userId || '',
            $populate: 'roles'
        }
    }).then((user) => {
        user.data[0].roles = Array.from(user.data[0].roles);
        if (!(user.data[0].roles.filter((u) => u.name==='superhero').length > 0)) {
            throw new Forbidden('you are not a superhero, sorry...');
        }
        return Promise.resolve(context);
    });
};

exports.hasRole = (context, userId, roleName) => {
    const userService = context.app.service('/users/');

    return userService.get(userId || '', { query: { $populate: 'roles' } }).then((user) => {
        user.roles = Array.from(user.roles);

        return _.some(user.roles, (u) => u.name===roleName);
    });
};

/**
 * @param  {string, array[string]} inputPermissions
 * @returns resolves if the current user has ANY of the given permissions
 */
const hasPermission = (inputPermissions) => {
    const permissionNames = typeof inputPermissions==='string' ? [inputPermissions]:inputPermissions;

    return (context) => {
        const {
            params: { account, provider },
            app,
        } = context;
        // If it was an internal call then skip this context
        if (!provider) {
            return Promise.resolve(context);
        }

        if (!account && !account.userId) {
            throw new Forbidden('Can not read account data');
        }

        // Otherwise check for user permissions
        return app
                .service('users')
                .get(account.userId)
                .then(({ permissions = [] }) => {
                    const hasAnyPermission = permissionNames.some((perm) => permissions.includes(perm));
                    if (!hasAnyPermission) {
                        throw new Forbidden(`You don't have one of the permissions: ${permissionNames.join(', ')}.`);
                    }
                    return Promise.resolve(context);
                });
    };
};

/**
 * Test a permission again a user request.
 * When the hook funtkion is called, it requires an account object in params
 *
 * @param {string} inputPermission
 * @return {funktion} - feathers hook function requires context as an attribute
 */
// TODO: should accept and check multiple permissions
exports.hasSchoolPermission = (inputPermission) => async (context) => {
    const {
        params: { account },
        app,
    } = context;
    if (!account || !account.userId) {
        throw new Forbidden('Cannot read account data');
    }
    try {
        const user = await app.service('usersModel').get(account.userId, {
            query: {
                $populate: ['roles', 'schoolId'],
            },
        });

        const { schoolId: school } = user;

        const results = await Promise.allSettled(
                user.roles.map(async (role) => {
                    const { permissions = {} } = school;
                    // If there are no special school permissions, continue with normal permission check
                    if (!permissions[role.name] || !Object.prototype.hasOwnProperty.call(permissions[role.name], inputPermission)) {
                        return hasPermission(inputPermission)(context);
                    }
                    // Otherwise check for user's special school permission
                    if (permissions[role.name][inputPermission]) {
                        return context;
                    }
                    throw new Forbidden(`You don't have one of the permissions: ${inputPermission}.`);
                })
        );
        if (results.some((r) => r.status==='fulfilled')) {
            return context;
        }
    } catch (err) {
        const uuid = uuidv4();
        if (err.code >= 500) {
            throw new GeneralError(uuid);
        }
        logger.error(uuid, err);
    }

    throw new Forbidden(`You don't have one of the permissions: ${inputPermission}.`);
};

/**
 * @param  {string, array[string]} permissions
 * @returns resolves if the current user has ALL of the given permissions
 */
exports.hasAllPermissions = (permissions) => {
    const permissionNames = typeof permissions==='string' ? permissions:[permissions];
    return (context) => {
        const hasPermissions = permissionNames.every((permission) => hasPermission(permission)(context));
        return Promise.all(hasPermissions);
    };
};

exports.hasPermission = hasPermission;

/*
	excludeOptions = false => allways remove response
	excludeOptions = undefined => remove response when not GET or FIND request
	excludeOptions = ['get', ...] => remove when method not in array
 */
exports.removeResponse = (excludeOptions) => (context) => {
    // If it was an internal call then skip this context
    if (!context.params.provider) {
        return context;
    }

    if (excludeOptions===undefined) {
        excludeOptions = ['get', 'find'];
    }
    if (Array.isArray(excludeOptions) && excludeOptions.includes(context.method)) {
        return Promise.resolve(context);
    }
    context.result = { status: 200 };
    return Promise.resolve(context);
};

// non hook releated function
exports.hasPermissionNoHook = (context, userId, permissionName) => {
    const service = context.app.service('/users/');
    return service.get({ _id: userId || '' }).then((user) => {
        user.permissions = Array.from(user.permissions);
        return (user.permissions || []).includes(permissionName);
    });
};

exports.hasRoleNoHook = (context, userId, roleName, account = false) => {
    const userService = context.app.service('/users/');
    const accountService = context.app.service('/accounts/');
    if (account) {
        return accountService.get(userId).then((_account) =>
                userService.find({ query: { _id: _account.userId || '', $populate: 'roles' } }).then((user) => {
                    user.data[0].roles = Array.from(user.data[0].roles);

                    return user.data[0].roles.filter((u) => u.name===roleName).length > 0;
                })
        );
    }
    return userService.find({ query: { _id: userId || '', $populate: 'roles' } }).then((user) => {
        user.data[0].roles = Array.from(user.data[0].roles);

        return user.data[0].roles.filter((u) => u.name===roleName).length > 0;
    });
};

const resolveToId = (service, key, value) => {
    const query = {};
    query[key] = value;
    return service.find({ query }).then((results) => {
        const result = results.data[0];
        if (!result) throw new TypeError(`No records found where ${key} is ${value}.`);
        return result._id;
    });
};

// added next handler for save against path of undefined errors
const deepValue = (obj, path, newValue) => {
    // eslint-disable-next-line no-confusing-arrow
    const next = (obj2, path2) => (obj2===undefined ? obj2:obj2[path2]);
    path = path.split('.');
    const len = path.length - 1;
    let i;
    for (i = 0; i < len; i += 1) {
        obj = next(obj, path[i]);
    }

    if (newValue) obj[path[i]] = newValue;
    return next(obj, path[i]);
};

// resolves IDs of objects from serviceName specified by *key* instead of their *_id*
exports.resolveToIds = (serviceName, path, key) => (context) => {
    // get ids from a probably really deep nested path
    const service = context.app.service(serviceName);

    let values = deepValue(context, path) || [];
    if (typeof values==='string') values = [values];

    if (!values.length) return Promise.resolve();

    const resolved = values.map((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return resolveToId(service, key, value);
        }
        return Promise.resolve(value);
    });

    return Promise.all(resolved).then((_values) => {
        deepValue(context, path, _values);
        return context;
    });
};

// todo: Should removed
exports.permitGroupOperation = (context) => {
    if (!context.id) {
        throw new Forbidden('Operation on this service requires an id!');
    }
    return Promise.resolve(context);
};

// get the model instance to call functions etc  TODO make query results not lean
exports.computeProperty = (Model, functionName, variableName) => (context) =>
        Model.findById(context.result._id)
                .then((modelInstance) => modelInstance[functionName]()) // compute that property
                .then((result) => {
                    context.result[variableName] = Array.from(result); // save it in the resulting object
                })
                .catch((e) => logger.error(e))
                .then(() => Promise.resolve(context));

exports.mapPaginationQuery = (context) => {
    if ((context.params.query || {}).$limit==='-1') {
        context.params.paginate = false;
        delete context.params.query.$limit;
        return Promise.resolve(context);
    }
    return Promise.resolve(context);
};

exports.checkCorrectCourseOrTeamId = async (context) => {
    const { courseId, courseGroupId, teamId } = context.data || {};

    if (teamId) {
        const userId = context.params.account.userId.toString();
        const query = {
            userIds: {
                $elemMatch: { userId },
            },
            $select: ['_id'],
        };

        const team = await context.app.service('teams').get(teamId, { query });

        if (team===null) {
            throw new Forbidden('The entered team doesn\'t belong to you!');
        }
        return context;
    }

    if (courseGroupId || courseId) {
        const userId = context.params.account.userId.toString();
        // make it sense?
        let validatedCourseId = (courseId || '').toString() || (context.id || '').toString();
        let query = {
            _id: validatedCourseId,
            $or: [{ teacherIds: userId }, { substitutionIds: userId }],
            $select: ['_id'],
        };

        if (courseGroupId) {
            delete context.data.courseId;
            const courseGroup = await context.app.service('courseGroups').get(courseGroupId);
            validatedCourseId = courseGroup.courseId;
            query = {
                _id: validatedCourseId,
                $or: [{ teacherIds: userId }, { substitutionIds: userId }, { userIds: userId }],
                $select: ['_id'],
            };
        }

        const course = await context.app.service('courses').find({ query });

        if (course.total!==1) {
            throw new Forbidden('The entered course doesn\'t belong to you!');
        }
        return context;
    }

    return context;
};

exports.injectUserId = (context) => {
    if (typeof context.params.provider==='undefined') {
        if (context.data && context.data.userId) {
            context.params.account = { userId: context.data.userId };
            context.params.payload = { userId: context.data.userId };
            delete context.data.userId;
        }
    }

    return context;
};

const getUser = (context) =>
        context.app
                .service('users')
                .get(context.params.account.userId, {
                    query: {
                        $populate: 'roles',
                        // todo select in roles only role name
                        // test which keys from user should selected
                    },
                })
                .then((user) => {
                    if (user===null) {
                        throw new Error('User not found.');
                    }
                    return user;
                })
                .catch((err) => {
                    throw new NotFound('Can not fetch user.', err);
                });
exports.getUser = getUser;

const testIfRoleNameExist = (user, roleNames) => {
    if (typeof roleNames==='string') {
        roleNames = [roleNames];
    }
    if ((user.roles[0] || {}).name===undefined) {
        throw new Error('Role is not populated.');
    }
    return user.roles.some(({ name }) => roleNames.includes(name));
};

exports.enableQuery = (context) => {
    if (context.id) {
        context.params.query = context.params.query || {};
        context.params.query._id = typeof context.id==='string' ? new ObjectId(context.id):context.id;
        context.id = null;
    }
    return context;
};

exports.enableQueryAfter = (context) => {
    if (!context.params.query._id) {
        return context;
    }
    context.id = context.params.query._id;
    if (context.result.length===0) {
        throw new NotFound(`no record found for id '${context.params.query._id}'`);
    }
    context.result = context.result[0];
    return context;
};

exports.restrictToCurrentSchool = async (context) => {
    const user = await getUser(context);
    if (testIfRoleNameExist(user, 'superhero')) {
        return context;
    }
    const currentSchoolId = user.schoolId.toString();
    const { params } = context;
    // route
    if (params.route && params.route.schoolId && params.route.schoolId!==currentSchoolId) {
        throw new Forbidden('You do not have valid permissions to access this.');
    }
    // id
    if (['update', 'patch', 'remove'].includes(context.method) && context.id) {
        const target = await context.service.get(context.id);
        if (!equalIds(target.schoolId, user.schoolId)) {
            throw new NotFound(`no record found for id '${context.id.toString()}'`);
        }
    }
    // query
    const methodWithQuery =
            ['get', 'find'].includes(context.method) ||
            (['update', 'patch', 'remove'].includes(context.method) && context.id==null);
    if (methodWithQuery) {
        if (params.query.schoolId===undefined) {
            params.query.schoolId = user.schoolId;
        } else if (!equalIds(params.query.schoolId, currentSchoolId)) {
            throw new Forbidden('You do not have valid permissions to access this.');
        }
    }
    // data
    if (['create', 'update', 'patch'].includes(context.method)) {
        if (context.data.schoolId===undefined) {
            context.data.schoolId = currentSchoolId;
        } else if (!equalIds(context.data.schoolId, currentSchoolId)) {
            throw new Forbidden('You do not have valid permissions to access this.');
        }
    }

    return context;
};

/* todo: Many request pass id as second parameter, but it is confused with the logic that should pass.
	It should evaluate and make clearly.
 */
const userIsInThatCourse = (user, { userIds = [], teacherIds = [], substitutionIds = [] }, isCourse) => {
    const userId = user._id.toString();
    if (isCourse) {
        return (
                userIds.some((u) => equalIds(u, userId)) ||
                teacherIds.some((u) => equalIds(u, userId)) ||
                substitutionIds.some((u) => equalIds(u, userId))
        );
    }

    return userIds.some((u) => equalIds(u, userId)) || testIfRoleNameExist(user, 'teacher');
};

exports.restrictToUsersOwnCourses = (context) =>
        getUser(context).then((user) => {
            if (testIfRoleNameExist(user, ['superhero', 'administrator'])) {
                return context;
            }
            const { _id } = user;
            if (context.method==='find') {
                context.params.query.$and = context.params.query.$and || [];
                context.params.query.$and.push({
                    $or: [{ userIds: _id }, { teacherIds: _id }, { substitutionIds: _id }],
                });
            } else {
                const courseService = context.app.service('courses');
                return courseService.get(context.id).then((course) => {
                    if (!userIsInThatCourse(user, course, true)) {
                        throw new Forbidden('You are not in that course.');
                    }
                });
            }

            return context;
        });

const isProductionMode = NODE_ENV===ENVIRONMENTS.PRODUCTION;
exports.mapPayload = (context) => {
    if (!isProductionMode) {
        logger.info(
                'DEPRECATED: mapPayload hook should be used to ensure backwards compatibility only, ' +
                `and be removed if possible. path: ${context.path} method: ${context.method}`
        );
    }
    if (context.params.payload) {
        // eslint-disable-next-line prefer-object-spread
        context.params.authentication = Object.assign({}, context.params.authentication, {
            payload: context.params.payload,
        });
    }
    Object.defineProperty(context.params, 'payload', {
        get() {
            if (!isProductionMode) {
                logger.warning(
                        'reading params.payload is DEPRECATED, please use params.authentication.payload instead!' +
                        ` path: ${context.path} method: ${context.method}`
                );
            }
            return (context.params.authentication || {}).payload;
        },
        set(v) {
            if (!isProductionMode) {
                logger.warning(
                        'writing params.payload is DEPRECATED, please use params.authentication.payload instead!' +
                        `path: ${context.path} method: ${context.method}`
                );
            }
            if (!context.params.authentication) context.params.authentication = {};
            context.params.authentication.payload = v;
        },
    });
    return context;
};

exports.restrictToUsersOwnClasses = (context) =>
        getUser(context).then((user) => {
            if (testIfRoleNameExist(user, ['superhero', 'administrator', 'teacher'])) {
                return context;
            }
            if (context.method==='get') {
                const classService = context.app.service('classes');
                return classService.get(context.id).then((result) => {
                    const userId = context.params.account.userId.toString();
                    if (
                            !_.some(result.userIds, (u) => equalIds(u, userId)) &&
                            !_.some(result.teacherIds, (u) => equalIds(u, userId))
                    ) {
                        throw new Forbidden('You are not in that class.');
                    }
                });
            }
            if (context.method==='find') {
                const { _id } = user;
                if (typeof context.params.query.$or==='undefined') {
                    context.params.query.$or = [{ userIds: _id }, { teacherIds: _id }, { substitutionIds: _id }];
                }
            }
            return context;
        });

// meant to be used as an after context
exports.denyIfNotCurrentSchool = ({ errorMessage = 'Die angefragte Ressource gehört nicht zur eigenen Schule!' }) => (
        context
) =>
        getUser(context).then((user) => {
            if (testIfRoleNameExist(user, 'superhero')) {
                return context;
            }
            const requesterSchoolId = user.schoolId;
            const requestedUserSchoolId = (context.result || {}).schoolId;
            if (!requesterSchoolId.equals(requestedUserSchoolId)) {
                throw new Forbidden(errorMessage);
            }
            return context;
        });

// meant to be used as an after context
exports.denyIfNotCurrentSchoolOrEmpty = ({
                                             errorMessage = 'Die angefragte Ressource gehört nicht zur eigenen Schule!',
                                         }) => (context) => {
    if (!(context.result || {}).schoolId) {
        return context;
    }
    return this.denyIfNotCurrentSchool(errorMessage)(context);
};

exports.denyIfStudentTeamCreationNotAllowed = ({
                                                   errorMessage = 'The current user is not allowed to list other users!',
                                               }) => async (context) => {
    const currentUser = await getUser(context);
    if (!testIfRoleNameExist(currentUser, 'student')) {
        return context;
    }
    const currentUserSchoolId = currentUser.schoolId;
    const currentUserSchool = await context.app.service('schools').get(currentUserSchoolId);
    if (!currentUserSchool.isTeamCreationByStudentsEnabled) {
        throw new Forbidden(errorMessage);
    }
    return context;
};

exports.checkSchoolOwnership = (context) => {
    const { userId } = context.params.account;
    const objectId = context.id;
    const service = context.path;

    const genericService = context.app.service(service);
    const userService = context.app.service('users');

    return Promise.all([userService.get(userId), genericService.get(objectId)]).then((res) => {
        if (res[0].schoolId.equals(res[1].schoolId)) return context;
        throw new Forbidden('You do not have valid permissions to access this.');
    });
};

function validatedAttachments(attachments) {
    let cTotalBufferSize = 0;
    attachments.forEach((element) => {
        if (
                !element.mimetype.includes('image/') &&
                !element.mimetype.includes('video/') &&
                !element.mimetype.includes('application/msword') &&
                !element.mimetype.includes('application/pdf')
        ) {
            throw new Error('Email Attachment is not a valid file!');
        }
        cTotalBufferSize += element.size;
        if (cTotalBufferSize >= MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE) {
            throw new BadRequest('Email Attachments exceed the max. total file limit.');
        }
    });
}

// TODO: later: Template building
// z.B.: maildata.template =
//   { path: "../views/template/mail_new-problem.hbs", "data": { "firstName": "Hannes", .... } };
// if (maildata.template) { [Template-Build (view client/controller/administration.js)] }
// mail.html = generatedHtml || "";
exports.sendEmail = (context, maildata) => {
    const files = maildata.attachments || [];
    if (files) {
        validatedAttachments(files);
    }

    const userService = context.app.service('/users');
    const mailService = context.app.service('/mails');

    const roles = (typeof maildata.roles==='string' ? [maildata.roles]:maildata.roles) || [];
    const emails = (typeof maildata.emails==='string' ? [maildata.emails]:maildata.emails) || [];
    const userIds = (typeof maildata.userIds==='string' ? [maildata.userIds]:maildata.userIds) || [];
    const receipients = [];

    // create email attachments
    const attachments = [];
    files.forEach((element) => {
        try {
            attachments.push({ filename: element.name, content: Buffer.from(element.data) });
        } catch (error) {
            throw new Error('Unexpected Error while creating Attachment.');
        }
    });

    // email validation conform with <input type="email"> (see https://emailregex.com)
    const re = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    const replyEmail = maildata.replyEmail && re.test(maildata.replyEmail) ? maildata.replyEmail:null;

    const promises = [];

    if (roles.length > 0) {
        promises.push(
                userService.find({
                    query: {
                        roles,
                        schoolId: context.data.schoolId,
                        $populate: ['roles'],
                        $limit: 1000,
                    },
                })
        );
    }

    if (userIds.length > 0) {
        userIds.forEach((id) => {
            promises.push(userService.get(id));
        });
    }

    if (emails.length > 0) {
        emails.forEach((email) => {
            if (re.test(email)) {
                receipients.push(email);
            }
        });
    }

    if (promises.length > 0) {
        Promise.all(promises)
                .then((promise) => {
                    promise.forEach((result) => {
                        if (result.data) {
                            result.data.forEach((user) => {
                                receipients.push(user.email);
                            });
                        } else if (result.email) {
                            receipients.push(result.email);
                        }
                    });

                    _.uniq(receipients).forEach((email) => {
                        if (!maildata.content.text && !maildata.content.html) {
                            logger.warning('(1) No mailcontent (text/html) was given. Don\'t send a mail.');
                        } else {
                            mailService
                                    .create({
                                        email,
                                        replyEmail,
                                        subject: maildata.subject || 'E-Mail von der Schul-Cloud',
                                        headers: maildata.headers || {},
                                        content: {
                                            text: maildata.content.text || 'No alternative mailtext provided. Expected: HTML Template Mail.',
                                            html: '', // still todo, html template mails
                                        },
                                        attachments,
                                    })
                                    .catch((err) => {
                                        throw new BadRequest((err.error || {}).message || err.message || err || 'Unknown mailing error', err);
                                    });
                        }
                    });
                    return context;
                })
                .catch((err) => {
                    throw new BadRequest((err.error || {}).message || err.message || err || 'Unknown mailing error');
                });
    } else {
        if (!maildata.content.text && !maildata.content.html) {
            logger.warning('(2) No mailcontent (text/html) was given. Don\'t send a mail.');
        } else {
            _.uniq(receipients).forEach((email) => {
                mailService
                        .create({
                            email,
                            replyEmail,
                            subject: maildata.subject || 'E-Mail von der Schul-Cloud',
                            headers: maildata.headers || {},
                            content: {
                                text: maildata.content.text || 'No alternative mailtext provided. Expected: HTML Template Mail.',
                                html: '', // still todo, html template mails
                            },
                            attachments,
                        })
                        .catch((err) => {
                            throw new BadRequest((err.error || {}).message || err.message || err || 'Unknown mailing error');
                        });
            });
        }
        return context;
    }

    return context;
};

exports.arrayIncludes = (array, includesList, excludesList) => {
    for (let i = 0; i < includesList.length; i += 1) {
        if (array.includes(includesList[i])===false) {
            return false;
        }
    }

    for (let i = 0; i < excludesList.length; i += 1) {
        if (array.includes(excludesList[i])) {
            return false;
        }
    }
    return true;
};

/** used for user decoration of create, update, patch requests for mongoose-diff-history */
exports.decorateWithCurrentUserId = (context) => {
    // todo decorate document removal
    // todo simplify user extraction to do this only once
    try {
        if (!context.params.account) {
            context.params.account = {};
        }
        const { userId } = context.params.account;
        // if user not defined, try extract userId from jwt
        if (!userId && (context.params.headers || {}).authorization) {
            // const jwt = extractTokenFromBearerHeader(context.params.headers.authorization);
            // userId = 'jwt'; // fixme
        }
        // eslint-disable-next-line no-underscore-dangle
        if (userId && context.data && !context.data.__user) {
            // eslint-disable-next-line no-underscore-dangle
            context.data.__user = userId;
        }
    } catch (err) {
        logger.error(err);
    }
    return context;
};

/* Decorates context.params.account with the user's schoolId
 * @param {context} context Hook context
 * @requires authenticate('jwt')
 * @throws {BadRequest} if not authenticated or userId is missing.
 * @throws {NotFound} if user cannot be found
 */
exports.lookupSchool = async (context) => {
    if (context.params && context.params.account && context.params.account.userId) {
        const { schoolId } = await context.app.service('users').get(context.params.account.userId);
        context.params.account.schoolId = schoolId;
        return context;
    }
    throw new BadRequest('Authentication is required.');
};

exports.populateCurrentSchool = async (context) => {
    if (context.params && context.params.account && context.params.account.userId) {
        const { schoolId } = await context.app.service('users').get(context.params.account.userId);
        context.params.school = await context.app.service('schools').get(schoolId);
        return context;
    }
    throw new BadRequest('Authentication is required.');
};

exports.addCollation = (context) => {
    context.params.collation = { locale: 'de', caseLevel: true };
    return context;
};

/**
 * Stop flow if the email domain is blacklisted.
 *
 * @param property data property to check
 * @param optional the email has not to be present
 * @returns {*} context
 */
exports.blockDisposableEmail = (property, optional = true) => async (context) => {
    // available
    if (!Object.prototype.hasOwnProperty.call(context.data, property)) {
        if (!optional) {
            throw new BadRequest(`Property ${property} is required`);
        }

        return context;
    }

    // blacklisted
    if (Configuration.get('BLOCK_DISPOSABLE_EMAIL_DOMAINS')===true) {
        if (isDisposableEmail(context.data[property])) {
            throw new BadRequest('EMAIL_DOMAIN_BLOCKED');
        }
    }

    return context;
};

exports.authenticateWhenJWTExist = (context) => {
    if ((context.params.headers || {}).authorization) {
        return authenticate('jwt')(context);
    }
    return context;
};
