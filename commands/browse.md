---
description: Browse your online prompt library and copy a selected prompt
argument-hint: "[category]"
allowed-tools:
  - Bash
  - AskUserQuestion
  - Read
---

# Prompt Library Browser

You are a prompt library browser. Fetch prompts, let the user pick one, fill in any variables, and copy to clipboard.

## Steps

### 1. Load configuration

Read the config file:

```
${CLAUDE_PLUGIN_ROOT}/config/default-config.json
```

Parse the JSON and extract the `url` field.

### 2. Fetch prompts

Use **Bash** with curl to fetch prompts:

```bash
curl -s "URL_FROM_CONFIG"
```

Parse the JSON response to get the `prompts` array.

If the fetch fails, tell the user:
> "Could not fetch prompts. Run `/prmpt:init` first to connect your account."

### 3. Filter by category (if argument provided)

If `$ARGUMENTS` is not empty:
- Filter prompts where `category` matches `$ARGUMENTS` (case-insensitive)
- If no prompts match, tell the user: "No prompts found in category '$ARGUMENTS'. Available categories: [list unique categories]"

### 4. Present prompts to user

**ALWAYS** use **AskUserQuestion** to show prompts as a selectable list — even if there's only 1 prompt.

Rules for AskUserQuestion (max 4 options):
- If **4 or fewer prompts**: show all in one question
- If **more than 4 prompts**: first show categories as options (group by `category`), then after category selection show prompts within that category
- Each option: `label` = prompt `name`, `description` = prompt `description`

Question header: "Prompt"
Question text: "Select a prompt:"

### 5. Fill variables (if any)

After the user selects a prompt, scan its `content` for all `{{variable_name}}` patterns.

If NO variables found — skip to step 6.

If variables are found:
1. Collect all unique variable names (e.g. `{{file_path}}`, `{{language}}`, `{{focus_area}}`)
2. Ask the user for values using **AskUserQuestion**:
   - AskUserQuestion supports **max 4 questions per call**
   - If **1–4 variables**: ask all in one AskUserQuestion call
   - If **5–8 variables**: split into two AskUserQuestion calls (first 4, then remaining)
   - If **9+ variables**: keep batching in groups of 4
   - Each question:
     - `header`: variable name (e.g. "file_path")
     - `question`: "Value for {{variable_name}}?"
     - `options`: provide 2 contextual suggestions if obvious (e.g. for `language`: "TypeScript", "Python"), otherwise use generic placeholders like "Enter value" and "Skip". User can always select **Other** to type a custom value.
     - `multiSelect`: false
3. After collecting ALL values, replace every `{{variable_name}}` in the content with the provided value. If user chose "Skip", remove the `{{variable_name}}` placeholder entirely.

**Example:** A prompt with `{{file_path}}`, `{{language}}`, `{{focus_area}}` — one AskUserQuestion call with 3 questions.

### 6. Execute the prompt

Take the final prompt content (with all variables filled in) and **execute it immediately** as if the user typed it as a message. Apply it to the current codebase and working directory.

Do NOT just display the prompt text. Actually perform the task it describes.
