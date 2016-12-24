# Zendesk-GitLab

This is a very basic JavaScript application to run on the [Zendesk Application Framework](https://developer.zendesk.com). 

Zendesk-GitLab makes ondemand operations only and pulls GitLab API. Here's a complete list of what this package can do:

1. Integrates as a sidebar pane
2. When Zendesk ticket is created - it can link to an existing GitLab ticket, or create a new GitLab ticket
3. List members of selected project
4. List available labels of selected projects
5. Option to automatically pre-populate Title and Description fields from Zendesk ticket
6. Customize Title and Description when you create GitLab ticket
7. If the task has a Due Date - it will be transferred over to the GitLab ticket

[GitLab](https://www.gitlab.org) is an open source project management system that runs on a rails stack. With support for projects, issues, bugs and tasks, it can help manage projects efficiently and easily. 

This [Zendesk](https://www.zendesk.com) app allows agents and admins to interface with their current GitLab instances using the GitLab REST API.

## Requirements

1. A current, running instance of GitLab, with API access enabled, and [an API key or a Private Token](https://docs.gitlab.com/ee/api/README.html#authentication)

2. A Zendesk account (running New Zendesk)


## Known Issues

1. Note: This is more of an important thing to know: If the user whose token is used to create Issues in GitLab is not at least a *Reporter* level - Labels will not get recorded in the GitLab ticket. See [this issue](https://gitlab.com/gitlab-org/gitlab-ce/issues/22666)
2. Note: It works exact same for specifying the Assignee of the GitLab ticket'
3. If the change is done in GitLab directly - it will not push any info to Zendesk. This is a one-way communiction integration.
4. % Done - doesn't work because I couldn't find how what info I could base this on?
5. Didn't have any tickets with images, to test ImageAttachment and NonImageAttachments
6. Sometimes Labels load only on second project list refresh

## TODO

1. Implement OAUTH2 application wide authorization using gitlab oauth2
2. Support for Ticket update to automatically push changes to gitlab
3. Add caches to all elements
4. Already pulls list of Project Milestones, but I didn't figure out points of integration for it


## Installation

Note: I might submit it to the Zendesk Marketplace, in which case none of the installation instructions will be required and the app will be available for free at the marketplace but I haven't looked at their application submitting policy.

### Step 1.
```
git clone https://github.com/virtuman/zendesk-gitlab.git
cd zendesk-gitlab/src
```

### Step 2. (option to use gem or docker)
#### Build Package
Use one of the following 2 ways to prepare an upload package bundle. 
Once the package is generated - it will be placed in zendesk-gitlab/src/tmp/ folder.
[Use the following instructions to upload your app](https://help.zendesk.com/hc/en-us/articles/229489328)

##### a. Using Native zendesk tools `zat`
[Install Zendesk tools](https://developer.zendesk.com/apps/docs/agent/tools)

```
cd zendesk-gitlab/src
zat package
```

##### b. Using `zat` tool from `docker` image
Install docker and run the following command:

`docker run -v /path/to/zendesk-gitlab/src:/data -it -p 4567:4567 pindar/zat zat package`


## Specifications
1. [GitLab API v3](https://docs.gitlab.com/ce/api/#resources)
2. Zendesk API v2
3. [Zendesk ZAT v1](https://developer.zendesk.com/apps/docs/agent/data)

## Screenshots

### Project List Page

![](https://github.com/virtuman/zendesk-gitlab/blob/master/doc/screenshots/gitlab-project-list.png)

### Issue List Page

![](https://github.com/virtuman/zendesk-gitlab/blob/master/doc/screenshots/associated-gitlab-ticket-list.png)

### Issue Details Page

![](https://github.com/virtuman/zendesk-gitlab/blob/master/doc/screenshots/gitlab-ticket-details.png)

### New Issue Creation Page

![](https://github.com/virtuman/zendesk-gitlab/blob/master/doc/screenshots/gitlab-ticket-create.png)

## Contributors
Alexei Smirnov (virtuman)


## License
