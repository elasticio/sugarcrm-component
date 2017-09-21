# Sugar CRM Component
[![NPM version][npm-image]][npm-url]
[![Travis Build Status][travis-image]][travis-url]
[![DependencyStatus][daviddm-image]][daviddm-url]
[![Circle CI Build Status][circle-image]][circle-url]



> Sugar CRM component template for the [elastic.io
platform](https://www.elastic.io "elastic.io platform")

This is an open source component template for [Sugar
CRM](https://www.sugarcrm.com) which is developed specifically to run on
[elastic.io platform](https://www.elastic.io "elastic.io platform"). You can
clone it and change it as you wish. However, **if you plan to deploy it into
[elastic.io platform](https://www.elastic.io "elastic.io platform") you must
follow sets of instructions to succeed**.

## Before you Begin

Before you can deploy any code into our system **you must be a registered
elastic.io platform user**. Please see our home page at
[http://www.elastic.io](http://www.elastic.io) to learn how.

> Any attempt to deploy a code into our platform without a registration would be
rejected.

After the registration and opening of the account you must **[upload your SSH
Key](http://go2.elastic.io/manage-ssh-keys)** into our platform.

> If you fail to upload you SSH Key you will get **permission denied** error
during the deployment.

## Getting Started

After registration and uploading of your SSH Key you can proceed to deploy it
into our system. At this stage we suggest you to:
* [Create a team](http://go2.elastic.io/manage-teams) to work on your new
* component (**required**).
* [Create a repository](http://go2.elastic.io/manage-repositories) where your
* new component is going to *reside* inside the team that you have just created.
* For a simplicity you can name your repository **sugarcrm-component** or
* **sugarcrm**.

```bash
$ git clone https://github.com/elasticio/sugarcrm-component.git sugarcrm-component

$ cd sugarcrm-component
```
Now you can edit your version of **sugarcrm-component** and build your desired
component. Or you can just ``PUSH``it into our system to see the process in
action:

```bash
$ git remote add elasticio your-team@git.elastic.io:sugarcrm-component.git

$ git push elasticio master
```
Please follow the instruction provided in the [Create a
team](http://go2.elastic.io/manage-teams) and [Create a
repository](http://go2.elastic.io/manage-repositories) for a success.

## Creating an app on a SugarCRM instance

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
   1. **Description**: Optional value for your conveience

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

[npm-image]: https://badge.fury.io/js/sugarcrm-component.svg
[npm-url]: https://npmjs.org/package/sugarcrm-component
[travis-image]: https://travis-ci.org/elasticio/sugarcrm-component.svg?branch=master
[travis-url]: https://travis-ci.org/elasticio/sugarcrm-component
[daviddm-image]: https://david-dm.org/elasticio/sugarcrm-component.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/elasticio/sugarcrm-component
[circle-image]: https://circleci.com/gh/elasticio/sugarcrm-component.svg?style=svg&circle-token=b1275f44aed2c3448bee5dccf7cb0a8970a1a0d1
[circle-url]: https://circleci.com/gh/elasticio/sugarcrm-component