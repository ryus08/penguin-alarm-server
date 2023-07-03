/* eslint-disable camelcase */
const P = require("bluebird");
const rp = require("request-promise");
const _flatten = require("lodash.flatten");
const _filter = require("lodash.filter");
const _map = require("lodash.map");
const _max = require("lodash.max");
const _forEach = require("lodash.foreach");
const _get = require("lodash.get");

class GitLabClient {
  constructor({ token, projectCache, gitlabUrl }) {
    this.token = token;
    this.projectCache = projectCache;
    this.gitlabUrl = `${gitlabUrl}/api/v4/`;
  }

  async groupSearch({ name }) {
    const response = await rp(
      `${this.gitlabUrl}groups/?search=${name}&min_access_level=10&private_token=${this.token}`
    );

    return JSON.parse(response);
  }

  getProjects({ groupIds }) {
    return P.map(
      groupIds,
      (groupId) => {
        const options = {
          method: "GET",
          uri: `${this.gitlabUrl}groups/${groupId}?private_token=${this.token}`,
          resolveWithFullResponse: true
        };
        return this.projectCache.get(options, (opts) => {
          opts.url = opts.uri;
          return P.resolve(rp(opts));
        });
      },
      { concurrency: 3 }
    )
      .then((responses) =>
        _flatten(
          _map(responses, (response) => JSON.parse(response.body).projects)
        )
      )
      .then((projects) =>
        projects.filter((project) => project.merge_requests_enabled)
      );
  }

  getGroup({ groupId }) {
    return rp(
      `${this.gitlabUrl}groups/${groupId}?private_token=${this.token}`
    ).then((response) => JSON.parse(response));
  }

  addNotes({ merge }) {
    return rp(
      `${this.gitlabUrl}projects/${merge.project_id}/merge_requests/${merge.iid}/notes?private_token=${this.token}`
    ).then((response) => {
      const notes = JSON.parse(response);
      merge.notes = notes;
      return merge;
    });
  }

  getComments({ merge, pageNumber = 1 }) {
    if (!merge.comments) {
      merge.comments = [];
    }
    if (!merge.systemComments) {
      merge.systemComments = [];
    }
    const options = {
      method: "GET",
      url: `${this.gitlabUrl}projects/${merge.project_id}/merge_requests/${merge.iid}/notes?order_by=created_at&page=${pageNumber}&per_page=100&private_token=${this.token}`,
      resolveWithFullResponse: true
    };
    return rp(options).then((response) => {
      const body = JSON.parse(response.body);
      const comments = _filter(
        body,
        (note) =>
          note.system === false && note.author.name !== merge.author.name
      );
      const systemComments = _filter(body, (note) => note.system === true);
      merge.comments = merge.comments.concat(comments);
      merge.systemComments = merge.systemComments.concat(systemComments);
      if (response.headers["x-next-page"]) {
        // eslint-disable-next-line no-console
        return this.getComments({
          merge,
          pageNumber: response.headers["x-next-page"]
        });
      }

      return merge;
    });
  }

  addChanges({ merge }) {
    return (
      P.resolve(
        rp(
          `${this.gitlabUrl}projects/${merge.project_id}/merge_requests/${merge.iid}/changes?private_token=${this.token}`
        )
      )
        .tap((response) => {
          const changeData = JSON.parse(response);
          merge.changeStats = {
            changeCount: parseInt(changeData.changes_count, 10),
            new: _filter(changeData.changes, (change) => change.new_file)
              .length,
            deleted: _filter(
              changeData.changes,
              (change) => change.deleted_file
            ).length,
            renamed: _filter(
              changeData.changes,
              (change) => change.renamed_file
            ).length
          };
        })
        // eslint-disable-next-line no-console
        .catch((e) => console.error(e))
        .return(merge)
    );
  }

  addApprovers({ merge }) {
    return rp(
      `${this.gitlabUrl}projects/${merge.project_id}/merge_requests/${merge.iid}/approvals?private_token=${this.token}`
    ).then((response) => {
      const approvers = JSON.parse(response);
      merge.approvers = approvers;
      _forEach(approvers.approved_by, (approver) => {
        const approvals = _filter(
          merge.systemComments,
          (comment) =>
            comment.body === "approved this merge request" &&
            approver.user.id === comment.author.id
        );

        const approvalComment = _max(approvals, "created_at");
        if (approvalComment) {
          approver.approved_at = approvalComment.created_at;
        }
      });
      return merge;
    });
  }

  addActivity({ merge }) {
    return this.getComments({ merge })
      .then(() => this.addApprovers({ merge }))
      .return(merge);
  }

  getOpenMergeRequests({ projectId, projectName }) {
    return rp(
      `${this.gitlabUrl}projects/${projectId}/merge_requests?scope=all&state=opened&private_token=${this.token}`
    )
      .then((response) => JSON.parse(response))
      .then((response) => {
        response.forEach((mr) => {
          mr.projectName = projectName;
        });
        return response;
      });
  }

  getRecentMergeRequests({ projectId, projectName, numberOfDays = 14 }) {
    const d = new Date();
    d.setDate(d.getDate() - numberOfDays);
    return rp(
      `${
        this.gitlabUrl
      }projects/${projectId}/merge_requests?scope=all&created_after=${d.toJSON()}&private_token=${
        this.token
      }`
    )
      .then((response) => JSON.parse(response))
      .then((response) => {
        response.forEach((mr) => {
          mr.projectName = projectName;
        });
        return response;
      });
  }

  getMergeRequest({ project_id, iid }) {
    return P.resolve(
      rp(
        `${this.gitlabUrl}projects/${project_id}/merge_requests/${iid}?private_token=${this.token}`
      )
    )
      .then((response) => JSON.parse(response))
      .tap((merge) => this.addActivity({ merge }))
      .tap((merge) => this.addChanges({ merge }));
  }

  getDeployments({ id, name, avatar_url, web_url, previous }) {
    // first lets see how many deployments there are, which will help us not look where we don't need to
    return rp({
      uri: `${this.gitlabUrl}projects/${id}/deployments?private_token=${this.token}`,
      method: "HEAD"
    })
      .then((response) => {
        // if the current total matches what we already know, then we don't need to do anything else
        const total = parseInt(response["x-total"], 10);

        // if we have no previous knowledge, we'll start at 0 deployments
        const previousCount = _get(previous, "total", 0);
        if (total === previousCount) {
          return (
            previous || {
              total: 0,
              id,
              deployments: []
            }
          );
        }
        return rp(
          `${this.gitlabUrl}projects/${id}/deployments?private_token=${this.token}&sort=desc&per_page=50&order_by=created_at`
        ).then((resp) => ({
          total,
          id,
          deployments: JSON.parse(resp)
        }));
      })
      .then((response) => {
        response.deployments.forEach((deployment) => {
          deployment.projectName = name;
          deployment.projectAvatar = avatar_url;
          deployment.projectUrl = web_url;
        });
        return response;
      })
      .catch(() => []);
  }
}

module.exports = GitLabClient;
