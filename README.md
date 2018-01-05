# Sugar CRM Component
[![NPM version][npm-image]][npm-url]
[![Travis Build Status][travis-image]][travis-url]
[![DependencyStatus][daviddm-image]][daviddm-url]
[![Circle CI Build Status][circle-image]][circle-url]

[SugarCRM](https://www.sugarcrm.com) is a CRM system with a  a simple user
interface, industry-leading customer experience, and an intuitive customization
platform.

This is an open source component template for [Sugar
CRM](https://www.sugarcrm.com) which is developed specifically to run on
[elastic.io platform](https://www.elastic.io "elastic.io platform"). You can
clone it and change it as you wish.

# Authentication

## Creating an app on a SugarCRM instance
In order the platform to connect to your SugarCRM instance, an app needs to be
created on that instance.  Below are the steps to do so.  Once that is done, you
will provide a valid username and password to the elastic.io platform.  The
platform will exchange that username and password for a token.  After this
exchange happens, you may safely change the password without breaking the
integration.  In a production system, the best practice is to create a dedicated
user for the elastic.io platform.  This user should have the minimum required
permissions.

1. As an admin on your SugarCRM instance, go to the Administration panel

   ![screenshot from 2017-09-21 10-16-21](https://user-images.githubusercontent.com/5710732/30685820-76e92b22-9eb6-11e7-8efc-2715b9102f26.png)
1. Select **OAuth Keys**

   ![screenshot from 2017-09-21 10-17-08](https://user-images.githubusercontent.com/5710732/30685819-76e71f8a-9eb6-11e7-8f79-505111d2c0df.png)
1. In the top bar, select the dropdown for the now visible **OAuth Keys** option

   ![screenshot from 2017-09-21 10-17-45](https://user-images.githubusercontent.com/5710732/30685818-76dea1ca-9eb6-11e7-85ae-0dc7fc15e987.png)
1. Select **Create OAuth Key**
1. Fill in the following values:
   1. **Consumer Key Name**: Pick a name that is convenient to remember
   1. **Consumer Key**: Pick a strongly random string.  You will need to provide
   this information as part of the SugarCRM component account information
   1. **Consumer Secret**: Pick a strongly random string.  You will need to
   provide this information as part of the SugarCRM component account
   information
   1. **OAuth Version**: OAuth 2.0
   1. **Client Type**: Sugar User
   1. **Description**: Optional value for your convenience

   ![screenshot from 2017-09-21 10-18-21](https://user-images.githubusercontent.com/5710732/30685817-76c6c1d6-9eb6-11e7-991f-37830f1c35ac.png)
1. Click **Save**

## Authentication on elastic.io

![screenshot from 2017-09-21 10-29-00](https://user-images.githubusercontent.com/5710732/30686190-c23edfd0-9eb7-11e7-9dd8-ca29592bbb38.png)

Fill in the following for your account:
* **Name Your Account**: Name to identify this account on elastic.io
* **Your SugarCRM domain**: URL of your Sugar CRM instance
* **Your login**: Username used to login to SugarCRM instance
* **Your password**: Password used to login to SugarCRM instance
* **Your OAuth 2.0 Consumer Key**: Value created in step 5ii.
* **Your OAuth 2.0 Consumer Secret**: Value created in step 5iii.

Parameter `platform` should be set to some custom string but should be unique per sugar component in order to avoid any potential login conflicts.
So now `platform` is "`$TASK_ID:$STEP_ID`".

# Triggers

## Fetching New and Updated Objects from SugarCRM

It is possible to fetch any type newly created and/or updated object in your
SugarCRM instance.  Select the trigger **Fetch new and updated objects** and
then configure the following:

![screenshot from 2017-09-21 11-20-40](https://user-images.githubusercontent.com/5710732/30688610-f825e81c-9ebe-11e7-8736-3c522f92c65c.png)

* **SugarCRM module to fetch**: Type of object to fetch
* **Entries to fetch**: Select new, updated or both
* **Return results individually**: Return new results individually or as an
 array.
* **Number of records to fetch**: Maximum number of records to fetch per call.
 If left blank then the default set on your SugarCRM instance.

 ## Creating and Updating Objects in SugarCRM

 It is possible to create and or update any type of object in your SugarCRM instance.  The following actions are possible:
 * Create a new entry
 * Update an existing entry
 * Upsert Entry (If the entry already exists, update it, otherwise create it.)

In order for update and upsert operations to work, the objects being
updated/usperted must have a property that must uniquely identify that object.
This could be the SugarCRM id but it could also be a separate external ID.
Furthermore, the message coming into this component must have this ID as well.

Once a SugarCRM module is selected (object type), all writable fields on that
object can be set.  The **Property to match** is the property on the object (in
both SugarCRM and in the incoming message) which will contain the unique ID to
match.

![screenshot from 2017-09-21 11-51-05](https://user-images.githubusercontent.com/5710732/30690045-3253e33c-9ec3-11e7-860d-af6e5f55eac8.png)

# Configuration Info
## Required environment variables
No environment variables need to be configured.

## Version and compatibility information
This component interacts with version 10 of the SugarCRM REST API.  It has been
tested with ``SugarCRM Enterprise, Version 7.9.0.1 (Build 33)``

[npm-image]: https://badge.fury.io/js/sugarcrm-component.svg
[npm-url]: https://npmjs.org/package/sugarcrm-component
[travis-image]: https://travis-ci.org/elasticio/sugarcrm-component.svg?branch=master
[travis-url]: https://travis-ci.org/elasticio/sugarcrm-component
[daviddm-image]: https://david-dm.org/elasticio/sugarcrm-component.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/elasticio/sugarcrm-component
[circle-image]: https://circleci.com/gh/elasticio/sugarcrm-component.svg?style=svg&circle-token=b1275f44aed2c3448bee5dccf7cb0a8970a1a0d1
[circle-url]: https://circleci.com/gh/elasticio/sugarcrm-component