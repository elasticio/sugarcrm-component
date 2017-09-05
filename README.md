# sugarcrm-component [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

> Sugar CRM component template for the [elastic.io platform](https://www.elastic.io "elastic.io platform")

This is an open source component template for [Sugar CRM](https://www.sugarcrm.com) which is developed specifically to run on [elastic.io platform](https://www.elastic.io "elastic.io platform"). You can clone it and change it as you wish. However, **if you plan to deploy it into [elastic.io platform](https://www.elastic.io "elastic.io platform") you must follow sets of instructions to succeed**.

## Before you Begin

Before you can deploy any code into our system **you must be a registered elastic.io platform user**. Please see our home page at [http://www.elastic.io](http://www.elastic.io) to learn how.

> Any attempt to deploy a code into our platform without a registration would be rejected.

After the registration and opening of the account you must **[upload your SSH Key](http://go2.elastic.io/manage-ssh-keys)** into our platform.

> If you fail to upload you SSH Key you will get **permission denied** error during the deployment.

## Getting Started

After registration and uploading of your SSH Key you can proceed to deploy it into our system. At this stage we suggest you to:
* [Create a team](http://go2.elastic.io/manage-teams) to work on your new component (**required**).
* [Create a repository](http://go2.elastic.io/manage-repositories) where your new component is going to *reside* inside the team that you have just created. For a simplicity you can name your repository **sugarcrm-component** or **sugarcrm**.

```bash
$ git clone https://github.com/elasticio/sugarcrm-component.git sugarcrm-component

$ cd sugarcrm-component
```
Now you can edit your version of **sugarcrm-component** and build your desired component. Or you can just ``PUSH``it into our system to see the process in action:

```bash
$ git remote add elasticio your-team@git.elastic.io:sugarcrm-component.git

$ git push elasticio master
```
Please follow the instruction provided in the [Create a team](http://go2.elastic.io/manage-teams) and [Create a repository](http://go2.elastic.io/manage-repositories) for a success.

## Creating an app on a SugarCRM instance

# As an admin on your SugarCRM instance, go to the Administration panel
# Select **OAuth Keys**
# In the top bar, select the dropdown for the now visible **OAuth Keys** option
# Select **Create OAuth Key**
# Fill in the following values:
** **Consumer Key Name**: Pick a name that is convenient to remember
** **Consumer Key**: Pick a strongly random string.  You will need to provide this information as part of the SugarCRM component account information
** **Consumer Secret**: Pick a strongly random string.  You will need to provide this information as part of the SugarCRM component account information
** **OAuth Version**: OAuth 2.0
** Client Type**: Sugar User
** **Description**: Optional value for your conveience
# Click save



[npm-image]: https://badge.fury.io/js/sugarcrm-component.svg
[npm-url]: https://npmjs.org/package/sugarcrm-component
[travis-image]: https://travis-ci.org/elasticio/sugarcrm-component.svg?branch=master
[travis-url]: https://travis-ci.org/elasticio/sugarcrm-component
[daviddm-image]: https://david-dm.org/elasticio/sugarcrm-component.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/elasticio/sugarcrm-component
