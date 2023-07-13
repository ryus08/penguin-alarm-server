# Penguin
A server which aggregates and caches git-provider (currently just Gitlab) information

## TODO

P0

* Durable but non-dynamo repository. Local disk would probably be good enough
* "stardard" middleware, at least:
  * AuthZ (authZ used to check JWT Claim)
  * error handling, was @cimpress-technology/belterrorhandling
  * Logging
* Check order of loading middleware
* More gracefully skip newrelic
* More gracefully skip AWS ML
* Set rp timeouts higher
* Use a real cache in ./src/clients/clientbuilder
* publish docker image
* CORS

P1

* This README. How to build, run, and deploy
* Anything commented out in the config. These are nice to haves
* Get ML working without AWS. And write down how to get it working with AWS
* Get newrelic working behind an interface for other APM solutions
* Get the cimpress.yaml config in a better place for reintegrating for Cimpress.
  * Loading newrelic monitoring into the app and poller, see comment in app.js and pollers/poll.js
* Upgrade dependencies.
* Smoke tests
* Get the poller to trigger immediately on a new config
* Add new preferences methods to customizr