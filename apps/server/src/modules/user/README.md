
# Proposal

We can use this area for IDM related use cases, like user and groups.
The groups entity include in this context a array of userIds like:

- coursegroups
- course.teachers
- course.students
- course.substitionTeachers
- classes
- different team groups

and the parentIds like courseId.
This is similar to the informations that we get from the ldap/idm systems.
For sync we need no informations over permissions.
We only want to update this groups.

Later we can create real group collections and split the included groups from the collections.

The step over courseGroup entity on this place is, to get forward to the target.
