/**
 * dsh-skill-operate-phone —— 以编程方式向 `ctx.skills` 贡献一个技能，不注册工具。
 *
 * 技能正文随包发布（`../SKILL.md`），是唯一事实来源：把同一份 Markdown 丢进
 * `<工作区>/.agents/skills/operate-phone/SKILL.md` 也能被 skill-filesystem 直接加载，
 * 两条安装路径共用这一个文件。
 *
 * 本插件零运行时依赖：不读用户目录、不监听文件系统、不碰原生模块，因此在手机这种
 * 受限环境里也能注册（对比 `skill-filesystem` 需要 chokidar，本包不需要）。
 *
 * 函数式插件契约：具名导出 `name` / `inject` / `apply`，无默认导出。
 */
import { readFile } from 'node:fs/promises'

/** 插件名。 */
export const name = 'skill-operate-phone'

/** 需要 `ctx.skills` 服务；不声明 inject 时 `ctx.skills` 属性代理不可用。 */
export const inject = ['skills']

const PROVIDER = 'dsh-operate-phone'
const SKILL_NAME = 'operate-phone'
/** 打包提供者的标准优先级（对应 dsh 的 BUNDLED_SKILL_RANK）。 */
const SKILL_RANK = 600
const SKILL_FILE = new URL('../SKILL.md', import.meta.url)

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

let pending

/**
 * 读取并解析技能正文，结果缓存复用。
 * @returns 技能的 `description`（取自 frontmatter）与 `content`（去掉 frontmatter 的正文）。
 * @throws 当 SKILL.md 缺少 description 或正文为空时抛出，避免装载一个空技能。
 */
function loadSkill() {
  pending ??= readFile(SKILL_FILE, 'utf8').then((raw) => {
    const match = FRONTMATTER.exec(raw)
    const front = match === null ? '' : match[1]
    const content = raw.slice(match === null ? 0 : match[0].length).trim()
    const row = front.split(/\r?\n/).find((line) => line.startsWith('description:'))
    const description = row === undefined
      ? ''
      : row.slice('description:'.length).trim().replace(/^["']|["']$/gu, '')
    if (description.length === 0) throw new Error(`${PROVIDER}: SKILL.md 缺少 description`)
    if (content.length === 0) throw new Error(`${PROVIDER}: SKILL.md 正文为空`)
    return { description, content }
  })
  return pending
}

/**
 * 注册技能提供者。
 * @param ctx - 携带 `ctx.skills` 技能的上下文。
 */
export function apply(ctx) {
  ctx.skills.registerProvider(() => ({
    name: PROVIDER,
    async list() {
      const { description } = await loadSkill()
      return [{
        name: SKILL_NAME,
        description,
        invocation: { modelInvocable: true, userInvocable: true },
        provider: PROVIDER,
        source: 'bundled',
        rank: SKILL_RANK,
        locator: SKILL_FILE.href,
      }]
    },
    async get(candidate) {
      const { rank: _rank, locator: _locator, ...summary } = candidate
      const { content } = await loadSkill()
      return { ...summary, content }
    },
  }))
}
