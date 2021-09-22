export declare const findPullRequestsInfoByReferenceName: string;
export declare const findPullRequestInfoByNumber: string;
export declare const findPullRequestCommits = "\n  query FindPullRequestsInfoByReferenceName($repositoryOwner: String!, $repositoryName: String!, $pullRequestNumber: Int!, $pageSize: Int!, $endCursor: String) {\n    repository(owner: $repositoryOwner, name: $repositoryName) {\n      pullRequest(number: $pullRequestNumber) {\n        commits(first: $pageSize, after: $endCursor) {\n          edges {\n            node {\n              commit {\n                author {\n                  user {\n                    login\n                  }\n                }\n                signature {\n                  isValid\n                }\n              }\n            }\n          }\n          pageInfo {\n            endCursor\n            hasNextPage\n          }\n        }\n      }\n    }\n  }\n";
//# sourceMappingURL=queries.d.ts.map