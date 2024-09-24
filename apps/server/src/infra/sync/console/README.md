# Sync console
This is a console application that allows you to start the synchronization process for different sources.

## Usage
To start the synchronization process, run the following command:
```bash
npm run nest:start:console sync run <target>
```

Where `<target>` is the name of the system you want to start the synchronization for. The currently available systems are:
- `tsp` - Synchronize Thüringer schulportal.

If the target is not provided, the synchronization will not start and the available targets will be displayed in an error message.
```bash
{
    message: 'Either synchronization is not activated or the target entered is invalid',  
    data: { enteredTarget: 'tsp', availableTargets: { TSP: 'tsp' }}
}
```

## TSP synchronization
The TSP synchronization is controlled with a feature flag  `FEATURE_TSP_SYNC_ENABLED`. This is now set to `false`.