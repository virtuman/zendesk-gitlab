(function () {
    var PROJECT_STATUS_ARCHIVED = false;
    return {
        PROJECT_TO_USE: 1,
        MEMBERS: [],
        LABELS: [],
        MILESTONES: [],
        PROJECTS: [],
        appID: 'GitLabAPP_IntegrationV1',
        requests: {
            getAudit: function (id) {
                this.showSpinner(true);
                return {
                    url: '/api/v2/tickets/' + id + '/audits.json',
                    type: 'GET',
                    contentType: 'application/json',
                    dataType: 'json'
                };
            },
            updateTicket: function (id, data) {
                this.showSpinner(true);
                return {
                    url: '/api/v2/tickets/' + id + '.json',
                    type: 'PUT',
                    data: data,
                    dataType: 'json',
                    contentType: 'application/json'
                };
            },
            postGitLab: function (project, data) {
                this.showSpinner(true);
                return {
                    url: this.settings.gitlab_url + '/api/v3/projects/' + this.PROJECT_TO_USE + '/issues?private_token={{setting.apiKey}}',
                    type: 'POST',
                    dataType: 'json',
                    data: data,
                    secure: true
                };
            },
            getProjects: function () {
                this.showSpinner(true);
                return {
                    url: this.settings.gitlab_url + '/api/v3/projects?private_token={{setting.apiKey}}&per_page=100',
                    type: 'GET',
                    dataType: 'json',
                    secure: true
                };
            },
            getMilestones: function () {
                this.showSpinner(true);
                return {
                    url: this.settings.gitlab_url + '/api/v3/projects/' + this.PROJECT_TO_USE + '/milestones/?private_token={{setting.apiKey}}&state=active',
                    type: 'GET',
                    dataType: 'json',
                    secure: true
                };
            },
            getIssue: function (issue_id, project_id) {
                this.showSpinner(true);

                return {
                    url: this.settings.gitlab_url + '/api/v3/projects/' + project_id + '/issues/' + issue_id + '?private_token={{setting.apiKey}}',
                    type: 'GET',
                    dataType: 'json',
                    secure: true
                };
            },
            getLabels: function () {
                this.showSpinner(true);
                return {
                    url: this.settings.gitlab_url + '/api/v3/projects/' + this.PROJECT_TO_USE + '/labels?private_token={{setting.apiKey}}',
                    type: 'GET',
                    dataType: 'json',
                    secure: true
                };
            },
            getMembers: function () {
                this.showSpinner(true);
                return {
                    url: this.settings.gitlab_url + '/api/v3/projects/' + this.PROJECT_TO_USE + '/members?private_token={{setting.apiKey}}',
                    type: 'GET',
                    dataType: 'json',
                    secure: true
                };
            }
        },
        events: {
            'app.activated': 'onActivated',
            'postGitLab.done': 'result',
            'click #submitToGitLab': 'prep_to_post',
            'getProjects.done': 'listProjects',
            'getAudit.done': 'listIssues',
            'click .js-project': 'projectSelect',
            'updateTicket.done': 'reset',
            'click .issue': 'get_issue',
            'click .back_button': 'onActivated',

            'click .nav-pills .js-projects': function () {
                this.setActivePill('js-projects');
                this.ajax('getProjects');
            },
            'click .nav-pills .js-issues': function () {
                this.setActivePill('js-issues');
                this.ajax('getAudit', this.ticket().id());
            }
        },
        setActivePill: function (itemClass) {
            this.$('.nav-pills li').removeClass('active');
            this.$('.nav-pills li.' + itemClass).addClass('active');
        },
        renderError: function (error_text) {
            services.notify(error_text, 'error');
            this.switchTo('error', {error: error_text});
        },
        onActivated: function () {
            console.log('Zendesk-GitLab loaded');

            // Remove trailing slash from gitlab_url
            if (this.settings.gitlab_url.search('\/$') != -1) {
                this.settings.gitlab_url = this.settings.gitlab_url.slice(0, -1);
            }

            this.doneLoading = false;
            this.showSpinner(true);
            this.loadIfDataReady();
        },
        loadIfDataReady: function () {
            if (!this.doneLoading && this.ticket().status() != null && this.ticket().requester().id()) {
                this.doneLoading = true;
                this.ajax('getAudit', this.ticket().id());
            }
        },
        result: function (result) {
            services.notify(this.I18n.t('issue.posted'));
            var id = result.id;
            var project_id = result.project_id;
            var data = {
                "ticket": {
                    "comment": {
                        "public": false,
                        "value": this.I18n.t('issue.pushed') + "\n\n" + this.settings.gitlab_url + "/issues/" + id + "\n\n"
                    }, "metadata": {"pushed_to_gitlab": true, "gitlab_id": id, "gitlab_project_id": project_id}
                }
            };
            data = JSON.stringify(data);
            this.ajax('updateTicket', this.ticket().id(), data);
        },
        listProjects: function (data) {
            if (data == null) {
                this.renderError("No data returned. Please check your API key.");
                return false;
            }
            // Only show active projects and sort by name
            data = data.filter(function (project) {
                return project.archived === PROJECT_STATUS_ARCHIVED;
            }).map(function (project) {
                // Prefix parent project's name
                if (project.hasOwnProperty('parent')) {
                    project.name = project.parent.name + ' - ' + project.name;
                }
                return project;
            }).sort(function (a, b) {
                if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                return 0;
            });

            this.PROJECTS = data;

            this.setActivePill('js-projects');
            this.switchTo('projectList', {project_data: data});
            this.showSpinner(false);
        },
        prep_to_post: function () {

            this.showSpinner(true);

            var subject = this.$('#gitlab_subject').val();
            var labels = this.$('#gitlab_labels').val();
            var priority = this.$('#gitlab_priority').val();
            var asignee = this.$('#gitlab_assignee').val();
            var milestone = this.$('#gitlab_milestone').val();
            var due_date = null;

            if (this.ticket().type() === "task") {
                due_date = this.ticket().customField('due_date');
            }

            if (subject.length < 1) {
                services.notify('You must include a subject.', 'error');
            } else {
                var data = {
                    "id": this.PROJECT_TO_USE,
                    "title": subject,
                    "description": this.$('#gitlab_note').val() + "\n\nTicket URL: https://" + this.currentAccount().subdomain() + ".zendesk.com/tickets/" + this.ticket().id() + "\n\n",
                    "assignee_id": asignee,
                    "milestone_id": milestone,
                    "due_date": "due_date",
                    "labels": labels.join(',')
                };
                this.ajax('postGitLab', this.settings.project, data);
            }
        },
        projectSelect: function (e) {

            this.showSpinner(true);

            this.PROJECT_TO_USE = e.target.id;
            var doneRequests = 0;
            this.ajax('getLabels')
                .done(function (data) {
                    this.LABELS = data;
                }.bind(this))
                .always(function () {
                    doneRequests++;
                });

            this.ajax('getMilestones')
                .done(function (data) {
                    this.MILESTONES = data;
                }.bind(this))
                .always(function () {
                    doneRequests++;
                });

            this.ajax('getMembers')
                .done(function (data) {
                    var members = [];
                    data.forEach(function (membership) {
                        members.push(membership);
                    });
                    this.MEMBERS = data;
                }.bind(this))
                .always(function () {
                    doneRequests++;
                });

            // Wait for both requests to finish
            var interval = setInterval(function () {
                if (doneRequests == 2) {
                    clearInterval(interval);
                    this.showSpinner(false);

                    var description = [];

                    if (this.settings.prepopulateTicketDescription) {
                        this.ticket().comments().forEach(function (comment) {
                            description.push(comment.author().name() + ": \n" + comment.value());

                            comment.imageAttachments().forEach(function (attachment) {
                                description.push(JSON.stringify(attachment));
                            });
                            comment.nonImageAttachments().forEach(function (attachment) {
                                description.push(JSON.stringify(attachment));
                            });
                        });

                        if (this.ticket().type() === "incident" && this.ticket().customField('problem_id')) {
                            description.push("ProblemID: " + this.ticket().customField('problem_id'));
                        }

                        if (this.ticket().type() === "task") {
                            description.push("Due Date: " + this.ticket().customField('due_date'));
                        }

                        description.push("Type: " + this.ticket().type());
                        description.push("Assignee: " + this.ticket().assignee().user().name());
                        description.push("Priority: " + this.ticket().priority());
                        description.push("Requester: " + this.ticket().requester().name());
                        description.push("Status: " + this.ticket().status());
                        description.push("Created: " + this.ticket().createdAt());
                    }

                    this.switchTo('newIssue', {
                        labels: this.LABELS,
                        members: this.MEMBERS,
                        subject: this.ticket().subject(),
                        description: description.join("\n\n")});
                }
            }.bind(this), 500);
        },
        listIssues: function (data) {
            var ticketHasIssue = false;
            var issueList = [];
            for (var i = 0; i <= data.count; i++) {
                try {
                    var gitlab_meta = data.audits[i].metadata.custom;
                    if (gitlab_meta.pushed_to_gitlab) {
                        ticketHasIssue = true;
                        if (gitlab_meta.gitlab_project_id) {
                            issueList.push({
                                issue_id: gitlab_meta.gitlab_id,
                                project_id: gitlab_meta.gitlab_project_id
                            });
                        }
                    }
                } catch (err) {
                }
            }

            if ( ! ticketHasIssue) {
                // No issues available, so load project list
                this.ajax('getProjects');
                this.showIssueTab(false);
                return;
            }

            this.showIssueTab(true);

            var spawned = 0;
            var returned = 0;
            var issueDetails = [];
            issueList.forEach(function (issue) {
                spawned++;
                this.ajax('getIssue', issue.issue_id, issue.project_id)
                    .done(function (data) {
                        data.closed = (data.state == 'closed');
                        issueDetails.push(data);
                    }.bind(this))
                    .fail(function() {
                        this.renderError("Specified issue ticket was not found in " + this.name());
                    })
                    .always(function () {
                        returned++;
                    });
            }.bind(this));

            var interval = setInterval(function () {
                if (spawned == returned) {
                    clearTimeout(interval);

                    this.setActivePill('js-issues');
                    this.switchTo('issueList', {issues: issueDetails});
                    this.showSpinner(false);
                }
            }.bind(this), 500);

        },
        reset: function () {
            this.ajax('getAudit', this.ticket().id());
        },
        get_issue: function (e) {
            this.showSpinner(true);
            var issue_id = e.target.dataset.id;
            var project_id = e.target.dataset.pid;
            this.ajax('getIssue', issue_id, project_id)
                .done(function (data) {
                    this.show_issue(data);
                }.bind(this))
                .fail(function() {
                    this.renderError("Specified issue ticket was not found in " + this.name());
                });
        },
        show_issue: function (data) {
            this.setActivePill('js-issues');
            this.showSpinner(false);
            this.switchTo('showIssue', {
                issue: data,
                url: this.settings.gitlab_url + '/api/v3/projects/' + data.project_id + '/issues/' + data.id
            });
        },
        showSpinner: function(status) {
            if(status === true) {
                this.$('#spinner').show();
                this.$('#main').hide();
            } else {
                this.$('#spinner').hide();
                this.$('#main').show();
            }
        },
        showIssueTab: function(status) {
            if(status) {
                this.$('.js-issues').show();
            } else {
                this.$('.js-issues').hide();
            }
        }
    };
}());
