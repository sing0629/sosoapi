import assert from 'node:assert/strict'
import test from 'node:test'
import { discoverTarget } from './threads-target.mjs'

const workspace = { id: 'w1', name: 'Example Workspace', slug: 'example', role: 'editor' }
const second = { id: 'w2', name: 'Other Workspace', slug: 'other', role: 'editor' }
const facts = ['can_publish_text', 'can_auto_publish_text'].map((capability) => ({
  capability,
  availability: 'available',
  observed_allowed: true,
  valid_until: new Date(Date.now() + 3_600_000).toISOString(),
}))
const account = {
  id: 'a1', workspace_id: workspace.id, platform: 'threads', handle: 'example',
  health_state: 'ready', status: 'valid', capability_facts: facts,
}

function fixture({ workspaces = [workspace], accounts = [account], first } = {}) {
  const calls = []
  async function call(route, input) {
    calls.push({ route, input })
    switch (route) {
      case '/identity-api/workspace/list':
        return first ?? { state: 'ok', body: { active_workspace_id: workspace.id, workspaces } }
      case '/identity-api/user/social-accounts/list':
        return { state: 'ok', body: { accounts } }
      default:
        assert.fail('Discovery must only call the two account reads')
    }
  }
  return { call, calls }
}

test('selects the named workspace and exact eligible Threads handle', async () => {
  const { call, calls } = fixture({ workspaces: [second, workspace] })
  const target = await discoverTarget(call, { workspace: 'Example Workspace', account: '@EXAMPLE' })
  assert.equal(target.state, 'ready')
  assert.equal(target.account.id, 'a1')
  assert.deepEqual(calls[1].input, { workspace_id: 'w1' })
})

test('does not use the active workspace as authorization for an ambiguous prompt', async () => {
  const { call, calls } = fixture({ workspaces: [workspace, second] })
  assert.equal((await discoverTarget(call)).state, 'choose_workspace')
  assert.equal(calls.length, 1)
})

test('stops when a named shared workspace is outside the current grant', async () => {
  const { call, calls } = fixture({ workspaces: [second] })
  const target = await discoverTarget(call, { workspace: 'Example Workspace' })
  assert.equal(target.state, 'workspace_not_found')
  assert.equal(calls.length, 1)
})

test('does not silently choose one of several accounts or a different requested handle', async () => {
  const { call } = fixture({ accounts: [account, { ...account, id: 'a2', handle: 'other' }] })
  assert.equal((await discoverTarget(call)).state, 'choose_account')
  assert.equal((await discoverTarget(call, { account: 'missing' })).state, 'no_matching_threads_account')
})

test('excludes out-of-scope accounts and flags missing publishing evidence', async () => {
  const { call } = fixture({
    accounts: [{ ...account, capability_facts: [] }, { ...account, id: 'a2', workspace_id: second.id }],
  })
  const target = await discoverTarget(call)
  assert.equal(target.state, 'publishing_not_verified')
  assert.equal(target.account.id, 'a1')
})

test('does not conflate a forbidden API response with a missing login', async () => {
  const first = { state: 'api_error', http_status: 403 }
  const { call, calls } = fixture({ first })
  assert.deepEqual(await discoverTarget(call), first)
  assert.equal(calls.length, 1)
})
