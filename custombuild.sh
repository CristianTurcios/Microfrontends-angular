#!/bin/sh
ng build microfrontends --prod --output-hashing=none && cat dist/microfrontends/runtime-es5.js dist/microfrontends/polyfills-es5.js dist/microfrontends/scripts.js dist/microfrontends/main-es5.js > preview/course.js