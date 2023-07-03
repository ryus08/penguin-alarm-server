# Penguin
A server which aggregates and caches git-provider (currently just Gitlab) information

## TODO

* This README. How to build, run, and deploy
* Durable but non-dynamo repository. Local disk would probably be good enough
* Check order of loading middleware
* "stardard" middleware, at least:
  * AuthN, AuthZ (authX used to check JWT Claim)
  * error handling, was @cimpress-technology/belterrorhandling
  * Logging
* Anything commented out in the config. These are nice to haves
* Get ML working without AWS. And write down how to get it working with AWS
* More gracefully skip newrelic and/or put behind an interface for other APM solutions
* Get the cimpress.yaml config in a better place for reintegrating for Cimpress.
  * Loading newrelic monitoring into the app and poller, see comment in app.js and pollers/poll.js
* Use a real cache in ./src/clients/clientbuilder
* Set rp timeouts higher
* Upgrade dependencies.
* Smoke tests
* publish docker image
* Get the poller to trigger immediately on a new config