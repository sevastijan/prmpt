#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface Prompt {
  id: string
  slug: string
  name: string
  category: string
  description: string
  content: string
}

function loadConfig(): { url: string } | null {
  // Try to find config relative to mcp dir (../config/default-config.json)
  const configPaths = [
    resolve(__dirname, '..', '..', 'config', 'default-config.json'),
    resolve(__dirname, '..', 'config', 'default-config.json'),
  ]

  // Check PRMPT_API_URL env var first
  if (process.env.PRMPT_API_URL) {
    return { url: process.env.PRMPT_API_URL }
  }

  for (const p of configPaths) {
    if (existsSync(p)) {
      const raw = readFileSync(p, 'utf-8')
      const config = JSON.parse(raw)
      // Skip placeholder config
      if (config.url && !config.url.includes('TOKEN_HERE')) {
        return config
      }
    }
  }

  return null
}

async function fetchPrompts(apiUrl: string): Promise<Prompt[]> {
  const res = await fetch(apiUrl)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return data.prompts || []
}

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.slice(2, -2)))]
}

function fillVariables(content: string, variables: Record<string, string>): string {
  let result = content
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}

const server = new McpServer({
  name: 'prmpt',
  version: '1.0.0',
})

// Tool: list prompts
server.tool(
  'list_prompts',
  'List all prompts from your prmpt library. Optionally filter by category.',
  {
    category: z.string().optional().describe('Filter by category name'),
  },
  async ({ category }) => {
    const config = loadConfig()
    if (!config) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'prmpt not configured. Run /prmpt:init first or set PRMPT_API_URL environment variable.',
          },
        ],
      }
    }

    const prompts = await fetchPrompts(config.url)
    const filtered = category
      ? prompts.filter((p) => p.category.toLowerCase() === category.toLowerCase())
      : prompts

    if (filtered.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: category
              ? `No prompts found in category "${category}".`
              : 'No prompts found.',
          },
        ],
      }
    }

    const categories = [...new Set(filtered.map((p) => p.category))]
    let text = `Found ${filtered.length} prompt(s):\n\n`

    for (const cat of categories) {
      text += `## ${cat}\n`
      for (const p of filtered.filter((pr) => pr.category === cat)) {
        const vars = extractVariables(p.content)
        const varStr = vars.length > 0 ? ` [vars: ${vars.join(', ')}]` : ''
        text += `- **${p.name}** (${p.slug})${varStr}\n`
        if (p.description) text += `  ${p.description}\n`
      }
      text += '\n'
    }

    return { content: [{ type: 'text' as const, text }] }
  }
)

// Tool: get a specific prompt by slug or name
server.tool(
  'get_prompt',
  'Get a specific prompt by slug or name. Returns the full content with variables listed.',
  {
    slug: z.string().describe('Prompt slug or name to find'),
  },
  async ({ slug }) => {
    const config = loadConfig()
    if (!config) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'prmpt not configured. Run /prmpt:init first or set PRMPT_API_URL environment variable.',
          },
        ],
      }
    }

    const prompts = await fetchPrompts(config.url)
    const query = slug.toLowerCase()
    const prompt = prompts.find(
      (p) => p.slug === query || p.name.toLowerCase() === query
    )

    if (!prompt) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Prompt "${slug}" not found. Use list_prompts to see available prompts.`,
          },
        ],
      }
    }

    const vars = extractVariables(prompt.content)
    let text = `# ${prompt.name}\n`
    text += `**Category:** ${prompt.category}\n`
    if (prompt.description) text += `**Description:** ${prompt.description}\n`
    if (vars.length > 0) text += `**Variables:** ${vars.join(', ')}\n`
    text += `\n---\n\n${prompt.content}`

    return { content: [{ type: 'text' as const, text }] }
  }
)

// Tool: use a prompt (fill variables and return ready-to-use content)
server.tool(
  'use_prompt',
  'Get a prompt with variables filled in. Pass variable values as key-value pairs.',
  {
    slug: z.string().describe('Prompt slug or name'),
    variables: z
      .record(z.string(), z.string())
      .optional()
      .describe('Key-value pairs to fill template variables, e.g. {"language": "TypeScript", "file_path": "src/index.ts"}'),
  },
  async ({ slug, variables }) => {
    const config = loadConfig()
    if (!config) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'prmpt not configured. Run /prmpt:init first or set PRMPT_API_URL environment variable.',
          },
        ],
      }
    }

    const prompts = await fetchPrompts(config.url)
    const query = slug.toLowerCase()
    const prompt = prompts.find(
      (p) => p.slug === query || p.name.toLowerCase() === query
    )

    if (!prompt) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Prompt "${slug}" not found. Use list_prompts to see available prompts.`,
          },
        ],
      }
    }

    const content = variables
      ? fillVariables(prompt.content, variables as Record<string, string>)
      : prompt.content

    const remainingVars = extractVariables(content)
    let text = content
    if (remainingVars.length > 0) {
      text += `\n\n---\n_Unfilled variables: ${remainingVars.join(', ')}_`
    }

    return { content: [{ type: 'text' as const, text }] }
  }
)

// Tool: list categories
server.tool(
  'list_categories',
  'List all prompt categories in your library.',
  {},
  async () => {
    const config = loadConfig()
    if (!config) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'prmpt not configured. Run /prmpt:init first or set PRMPT_API_URL environment variable.',
          },
        ],
      }
    }

    const prompts = await fetchPrompts(config.url)
    const categories = [...new Set(prompts.map((p) => p.category))].sort()

    if (categories.length === 0) {
      return {
        content: [{ type: 'text' as const, text: 'No categories found.' }],
      }
    }

    const counts = categories.map((cat) => {
      const count = prompts.filter((p) => p.category === cat).length
      return `- **${cat}** (${count} prompt${count !== 1 ? 's' : ''})`
    })

    return {
      content: [
        {
          type: 'text' as const,
          text: `Categories:\n\n${counts.join('\n')}`,
        },
      ],
    }
  }
)

// Start
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('Failed to start prmpt MCP server:', err)
  process.exit(1)
})
