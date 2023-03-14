# Module Description - files-storage

## Summary

This modul is a stand alone files service.
The service handles the binary files and the files meta data.
It provides upload and download streams.

The Service is used for deeper and individual authorisation contexts for files.

The module follows the generell structure:
S3 > Client > Service
DB > ORM > DataRecord > Repo > Domain Object > Service > ..
..Service > Uc > API Controller (external communication)
..Service > RMQP Consumer Controller (internal communication)

> Please note that Uc (Usecase) holds the authorisation and the consumer uses the service directly.
> (Avoid internal double authorisation)

## Goals and Ideas

### Stand Alone Service

Should work as stand alone service.
It does not know anything about the use cases it is used for.
It exists no real DB reference on any other place. No types, or interfaces are exposed.
We avoid dependency to other modules, except the ones in dependecies. (see: ## Dependencies)

### Parent Logic

Any file must be placed in a scope. It is called parent (type).
Multiple files can be added to one parent.
The parent is used for the authorisation.
The authorisation service must match and handle this types.

### S3 Structure

The service is connected to exactly one S3 storage bucket.
The overall owner is the instance that holds this bucket.
For each bucket it exists a couple of sub owners in our case the schools.
They are referenced as IDs and not as a type, to keep the service stand alone.
This allows us to get total size of files and needed space for one school.
Any school folder is created on demand.

Any file must be located in a school folder and referenced to a parent. (see: ### Parent Logic)

### Deleting Files

Currently a file is marked for deletion and finally removed after 7 days.
In s3 the marked file is moved to a ./trash folder.
The trash folder contains also sub folders for the schools.
> ./trash/schoolId/fileRecordId

### Internal and External App and Service Interface

For internal communication we use a queue based solution instead of http.
The pods with queue (amqp.module) and with https controller (api.module) can be started seperatly.

For queue based solution we use rabbitMQ AMQP.
> <https://www.rabbitmq.com/tutorials/amqp-concepts.html>
We only have a consumer in controller, but no producer.
The files service uses the rabbitMQ modul and solves the mapping to the exchange types.

The api controller is documented over swagger and must support open api.
It is used for the openAPI generation in client.

> If you want to communicate with the files services from the backend, please use the files-storage-client module.

## Dependencies

### Grafana

This is not a direct dependency.
But we use grafana to create metrics about the service and our storage.
The storage structure supports the metrics creation at school and instance level.

### DB

We use a mongoDB with a ORM (mikroORM) to store the files meta data and the contexts.
It uses only one data table / collection that is called filerecords.

### Storage

As storage we use a generell S3 with a the standard package for the client.
The package for the S3 client is wrapped in an own client interface that can be used for the communication.

folder structure in S3
> schoolId/fileRecordId
> .trash/schoolId/fileRecordId (see: ## Goals and Ideas > ### Deleting Files)

### Authorisation Module

The authorisation is solved by parents.
Therefore it is required that the parent types must be known to the authentication service.
Only the reference authorisation works.

It is possible to write an own authorisation modul and inject it, if you need it in future.

### Authentication Interceptors

To avoid duplicated code the intercetors and logic for logging, authorisation from core folder is used.
This adds a transitive dependecy to the authentication module.

## ToDos

- Connecting with the deletion concept, include also the delete of a complete school folder. (not implemented for now)
- An admin interface that supports "system user" and "support tools" not existing for now.
- Domain Object is not introduced
