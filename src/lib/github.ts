import { Octokit } from 'octokit';

// 获取配置好的目标仓库信息
const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER || '';
const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || '';

/**
 * 确保提供了仓库配置
 */
function checkConfig() {
  if (!owner || !repo || owner === 'YOUR_GITHUB_USERNAME' || repo === 'YOUR_GITHUB_REPO_NAME') {
    throw new Error('请在 .env.local 中配置 NEXT_PUBLIC_GITHUB_OWNER 和 NEXT_PUBLIC_GITHUB_REPO');
  }
}

/**
 * 获取仓库的目录树结构 (递归)
 */
export async function fetchFileTree(token: string, path: string = '') {
  checkConfig();
  const octokit = new Octokit({ auth: token });
  
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });
    return data;
  } catch (error) {
    console.error('Failed to fetch file tree:', error);
    throw error;
  }
}

/**
 * 获取具体文件的内容
 * 返回的内容为 Base64 编码，需要自行解码。同时返回文件的 sha 用于更新校验。
 */
export async function fetchFileContent(token: string, path: string) {
  checkConfig();
  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(data)) {
      throw new Error('Target path is a directory, not a file');
    }

    if (data.type !== 'file' || !data.content) {
      throw new Error('Target is not a valid file');
    }

    // 将 Base64 解码为 UTF-8 字符串
    const decodedContent = decodeURIComponent(escape(atob(data.content)));

    return {
      content: decodedContent,
      sha: data.sha,
    };
  } catch (error: any) {
    // 隐藏 404 报错打印，因为有可能是检查新建文件
    if (error.status !== 404) {
      console.error('Failed to fetch file content:', error);
    }
    throw error;
  }
}

/**
 * 获取仓库的 ID 和可用的 Discussion Categories (用于发帖)
 */
export async function fetchRepoAndCategories(token: string) {
  checkConfig();
  const octokit = new Octokit({ auth: token });
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        id
        discussionCategories(first: 10) {
          nodes {
            id
            name
            emoji
          }
        }
      }
    }
  `;
  const res: any = await octokit.graphql(query, { owner, repo });
  return res.repository;
}

/**
 * 获取讨论列表 (Discussions)
 */
export async function fetchDiscussions(token: string) {
  checkConfig();
  const octokit = new Octokit({ auth: token });
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        discussions(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            id
            number
            title
            body
            url
            author {
              login
              avatarUrl
            }
            category {
              name
            }
            comments {
              totalCount
            }
            createdAt
          }
        }
      }
    }
  `;
  const res: any = await octokit.graphql(query, { owner, repo });
  return res.repository.discussions.nodes;
}

/**
 * 创建讨论 (发帖)
 */
export async function createDiscussion(token: string, repositoryId: string, categoryId: string, title: string, body: string) {
  checkConfig();
  const octokit = new Octokit({ auth: token });
  const mutation = `
    mutation($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
      createDiscussion(input: {repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body}) {
        discussion {
          id
          url
        }
      }
    }
  `;
  const res: any = await octokit.graphql(mutation, { repositoryId, categoryId, title, body });
  return res.createDiscussion.discussion;
}

/**
 * 获取某个具体讨论的详细信息和回复列表
 */
export async function fetchDiscussionDetails(token: string, discussionNumber: number) {
  checkConfig();
  const octokit = new Octokit({ auth: token });
  const query = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        discussion(number: $number) {
          id
          title
          bodyHTML
          createdAt
          author {
            login
            avatarUrl
          }
          comments(first: 50) {
            nodes {
              id
              bodyHTML
              createdAt
              author {
                login
                avatarUrl
              }
            }
          }
        }
      }
    }
  `;
  const res: any = await octokit.graphql(query, { owner, repo, number: discussionNumber });
  return res.repository.discussion;
}

/**
 * 提交回复 (评论)
 */
export async function addDiscussionComment(token: string, discussionId: string, body: string) {
  checkConfig();
  const octokit = new Octokit({ auth: token });
  const mutation = `
    mutation($discussionId: ID!, $body: String!) {
      addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
        comment {
          id
        }
      }
    }
  `;
  const res: any = await octokit.graphql(mutation, { discussionId, body });
  return res.addDiscussionComment.comment;
}

/**
 * 保存/更新文件内容 (包含轻量级乐观锁：如果 sha 不匹配将被 GitHub 拒绝)
 */
export async function saveFileContent(
  token: string,
  path: string,
  content: string,
  sha?: string, // 如果是新建文件则不需要 sha，如果是更新文件则必传
  message: string = 'Update via SPO Co-Creation Platform'
) {
  checkConfig();
  const octokit = new Octokit({ auth: token });

  try {
    const params: any = {
      owner,
      repo,
      path,
      message,
      content: btoa(unescape(encodeURIComponent(content))), // 转换为 Base64
    };
    if (sha) {
      params.sha = sha;
    }

    const { data } = await octokit.rest.repos.createOrUpdateFileContents(params);

    return data;
  } catch (error: any) {
    if (error.status === 409) {
      throw new Error('Conflict: The file has been modified by someone else. Please refresh and try again.');
    }
    console.error('Failed to save file:', error);
    throw error;
  }
}
