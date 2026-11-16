# SosoAPI

Official SosoAPI CLI and MCP quickstart. Start by publishing a text post to Threads from your coding agent.

## Publish to Threads from one prompt

Use a coding agent with terminal access and Node.js 20 or newer. Open this repo in the agent, or ask it to read the [publishing instructions](https://github.com/vicky-ai-tech/sosoapi/blob/main/AGENTS.md). Give it a prompt like this, replacing the handle and text:

```text
Publish this exact text now to @myhandle on Threads using SosoAPI:
<your post text>

Use this repo's AGENTS.md. Return the confirmed Threads link.
```

The agent runs the public `sosoapi@0.5.25` CLI. It resolves your workspace and account, sends the post once, and follows the same Post ID until Threads confirms. If the destination is ambiguous, it asks which account to use before posting.

If your agent already has access to the workspace and Threads is connected, it goes straight to publishing the exact text you requested. If CLI access is missing, approve workspace access in SosoAPI. Meta approval and SosoAPI's account review are only for connecting a Threads account. You can register during CLI sign-in. For a shared workspace, accept the owner's invitation before granting agent access. Your coding agent may separately ask for terminal permission.

## Check the install without signing in

```sh
npx -y sosoapi@0.5.25 posts --help
```

The help should list `posts publish` and `posts status`. After signing in, run `node examples/threads-target.mjs` from this repo to check which Threads connection the CLI can use. This example displays account selection and readiness; it makes no publish call.

For hosted MCP setup in Codex or Claude Code, see the [SosoAPI connection guide](https://sosoapi.ai/docs/quickstart). For direct terminal usage, see the [CLI reference](https://sosoapi.ai/docs/cli-reference).

## Benchmark

[Benchmark protocol](docs/benchmark.md) describes how to compare CLI and browser publishing under the same conditions. Cold onboarding and warm publishing are measured separately.

If the quickstart helps you, star this repo. Report a reproducible issue through [GitHub Issues](https://github.com/vicky-ai-tech/sosoapi/issues) with the CLI version and a redacted error message.
