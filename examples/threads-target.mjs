import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const cliVersion = 'sosoapi@0.5.25'

function callCli(route, input) {
  const command = spawnSync('npx', ['-y', cliVersion, 'api', 'post', route], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    timeout: 45_000,
    shell: process.platform === 'win32',
  })
  if (command.error) throw command.error
  if (command.status !== 0) {
    if (/Not logged in\. Run: sosoapi auth login/.test(command.stderr)) {
      return { state: 'login_required' }
    }
    throw new Error('SosoAPI CLI request failed. Check the CLI diagnostic directly.')
  }
  const reply = JSON.parse(command.stdout)
  if (!Number.isInteger(reply.http_status)) throw new Error('Invalid SosoAPI CLI response envelope.')
  if (reply.http_status !== 200) return { state: 'api_error', http_status: reply.http_status }
  return { state: 'ok', body: reply.body }
}

const label = (value) => value.trim().toLowerCase()
const handleLabel = (value) => label(value).replace(/^@/, '')
const workspaceChoice = ({ id, name, slug, role }) => ({ id, name, slug, role })
const accountChoice = ({ id, handle, status, health_state }) => ({
  id, handle, status, health_state,
})

export async function discoverTarget(call, { workspace, account } = {}) {
  const listing = await call('/identity-api/workspace/list', {})
  if (listing.state !== 'ok') return listing
  const workspaces = listing.body.workspaces
  const matches = workspace
    ? workspaces.filter(({ id, slug, name }) => [id, slug, name].map(label).includes(label(workspace)))
    : workspaces
  if (!matches.length) return { state: 'workspace_not_found', workspaces: workspaces.map(workspaceChoice) }
  if (matches.length > 1) return { state: 'choose_workspace', workspaces: matches.map(workspaceChoice) }
  const targetWorkspace = workspaceChoice(matches[0])

  const list = await call('/identity-api/user/social-accounts/list', { workspace_id: targetWorkspace.id })
  if (list.state !== 'ok') return list
  const candidates = list.body.accounts.filter((row) =>
    row.platform === 'threads' && (!row.workspace_id || row.workspace_id === targetWorkspace.id))
  const matching = account
    ? candidates.filter((row) => row.handle && handleLabel(row.handle) === handleLabel(account))
    : candidates

  if (!matching.length) {
    return { state: 'no_matching_threads_account', workspace: targetWorkspace, accounts: candidates.map(accountChoice) }
  }
  if (matching.length > 1) {
    return { state: 'choose_account', workspace: targetWorkspace, accounts: matching.map(accountChoice) }
  }

  const target = matching[0]
  const capabilities = ['can_publish_text', 'can_auto_publish_text']
  const available = capabilities.every((name) => target.capability_facts?.some((fact) =>
    fact.capability === name &&
    fact.observed_allowed === true &&
    fact.availability === 'available' &&
    Date.parse(fact.valid_until) > Date.now(),
  ))
  const canEdit = ['owner', 'editor'].includes(targetWorkspace.role)
  const ready = canEdit && target.health_state === 'ready' &&
    ['valid', 'expiring_soon'].includes(target.status) &&
    !(Date.parse(target.blocked_until) > Date.now()) && available
  return {
    state: ready ? 'ready' : 'publishing_not_verified',
    workspace: targetWorkspace,
    account: accountChoice(target),
    text_publishing_verified: available,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({
      options: { workspace: { type: 'string' }, account: { type: 'string' } },
    })
    const result = await discoverTarget(callCli, values)
    console.log(JSON.stringify(result))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
