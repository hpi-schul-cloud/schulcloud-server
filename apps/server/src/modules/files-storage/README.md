# Module Description - files-storage

## Summary

This modul is a stand alone files service.
The service n
....

The module follow the generell structure:
S3 > Client > Service
DB > ORM > DataRecord > Repo > Domain Object > Service > ..
..Service > UC > API Controller (external communication)
..Service > RMQP Controller (internall communication)

....

## Goals and Ideas behind

### Stand Alone service

Should be work as stand alone service.
The don`t know anything about the use cases for they it is used.
It exists no real DB reference to any other place. No type, interface are exported.
Only that files must be placed to one overall storage owner. T

### S3 structure

The service is connected to exact one S3 storage bucket.
The overall owner is the instance that hold this bucket.
For each bucket it exists a couple of sub owner in our case the schools.
They are referenced as IDs and not as type to hold the service stand alone.
This allow us to get metric about the the total size of files and needed space for one school.
Any school folder is created on demand.

Any file must be located to a school folder and a parent. (see: Parent Logic)

### Parent Logic

Any file must be placed in a scope. It is called parent (type).
Multiple files can be added to one parent.
The parent is used for the authorisation. New parent types must be added.
The authorisation service must be possible to match and handle this types.

### Deleting a Files

### Internal and External App and Service Interface

quee based - rabbitMQ RMQP
....

api
....

files-storage-client module as useable client
....

## Dependencies

### Grafana

This is not a direct dependency.
But we use grafana to create metric about the service and our storage.
The storage structure support to create metrics and school and instance level.

### DB

We use a mongoDB with a ORM (mikroORM) for store the file meta data and the context.
It include only one data table / collection that is called file-record.
Like our datarecord.

### Storage

As storage we use a generall S3 with a the standard package for the client.
The package for the S3 client is wrapped in a own client interface that can be used for the communication.

...

### Authorisation Modul

Required that the parent types must be know that are used for the authentication.
Only the reference authorisation is work.

....

It is possible to write a own authorisation modul and inject it if it is needed in future.
To this please create a own .module file, export this and create a own app in app folder for execution.

## ToDos

- Connecting with the deletion concept, include also the delete of a complet school folder.
- A admin interface that support system user and support tools not exists for now.
- Domain Object is not introduced
