# MCP Server Setup Reference

This document covers detailed setup instructions for all MCP servers used by this skill.

## 1. Google Stitch MCP

Google Stitch generates full UI designs from text prompts using Gemini 2.5 Pro.

### Prerequisites
- Google Cloud account with billing enabled
- gcloud CLI installed

### Setup Steps

```bash
# 1. Login to Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default set-quota-project YOUR_PROJECT_ID

# 2. Enable Stitch API
gcloud beta services mcp enable stitch.googleapis.com
```

### MCP Configuration — Option A: OAuth (Recommended)
```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@_davideast/stitch-mcp", "proxy"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "YOUR_PROJECT_ID"
      }
    }
  }
}
```

### MCP Configuration — Option B: API Key
```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@_davideast/stitch-mcp", "proxy"],
      "env": {
        "STITCH_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `list_projects` | List all Stitch projects |
| `list_screens` | List screens in a project |
| `generate_screen_from_text` | Generate new UI from prompt |
| `extract_design_context` | Extract Design DNA (colors, fonts, layouts) |
| `fetch_screen_code` | Download HTML/CSS code |
| `fetch_screen_image` | Download screenshot as base64 |
| `build_site` | Build multi-page site from project |
| `create_project` | Create new workspace/project |

### Design Consistency Workflow
1. Generate first screen: "Create a modern SaaS dashboard with dark theme"
2. Extract DNA: `extract_design_context` from that screen
3. Generate next screen with context: "Create a settings page" + DNA from step 2
4. Result: Visually consistent multi-page design

### CLI Extras
```bash
# Preview screens locally
npx @_davideast/stitch-mcp serve -p PROJECT_ID

# Generate Astro site from project
npx @_davideast/stitch-mcp site -p PROJECT_ID

# Interactive browser
npx @_davideast/stitch-mcp view --projects
```

---

## 2. Nano Banana 2 MCP (Image Generation)

AI image generation using Google Gemini models.

### Prerequisites
- Google Gemini API key from Google AI Studio (free tier available)

### MCP Configuration — Python (uvx)
```json
{
  "mcpServers": {
    "nanobanana": {
      "command": "uvx",
      "args": ["nanobanana-mcp-server@latest"],
      "env": {
        "GEMINI_API_KEY": "your-gemini-api-key"
      }
    }
  }
}
```

### MCP Configuration — Node.js (npx)
```json
{
  "mcpServers": {
    "nano-banana-2": {
      "command": "npx",
      "args": ["-y", "nano-banana-2-mcp"],
      "env": {
        "GEMINI_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `generate_image` | Create image from text prompt |
| `edit_image` | Modify existing image with text |
| `continue_editing` | Iterate on last generated image |

### Prompt Engineering Tips
The MCP server auto-enhances prompts, but for best results:
- Be specific about lighting, composition, atmosphere
- Mention style references ("photorealistic", "flat illustration", "watercolor")
- Specify aspect ratio for different use cases (16:9 for hero, 1:1 for social)
- For character consistency, describe characters in detail across prompts

### Models Available
- **Nano Banana 2** (gemini-3.1-flash-image-preview) — Default, 4K, fast
- **Nano Banana Pro** (gemini-3-pro-image) — Maximum quality and reasoning
- **Legacy** (gemini-2.5-flash-image) — Original model

---

## 3. 21st.dev Magic MCP (Component Generation)

AI-powered React component generation from natural language.

### Prerequisites
- API key from 21st.dev Magic Console

### MCP Configuration
```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": {
        "API_KEY": "your-21st-dev-api-key"
      }
    }
  }
}
```

### Usage
In your AI agent's chat, type `/ui` followed by a description:
```
/ui modern pricing table with three tiers and a featured plan
/ui responsive navigation bar with mobile hamburger menu
/ui hero section with animated gradient background
/ui contact form with validation and dark theme
```

### Capabilities
- Multiple style variations per request
- Full TypeScript with proper props
- Responsive design out of the box
- SVGL integration for brand logos
- Community component library access

---

## Combined Configuration (All Three MCPs)

For Claude Code's `.claude/mcp.json`:
```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@_davideast/stitch-mcp", "proxy"],
      "env": {
        "STITCH_API_KEY": "your-stitch-key"
      }
    },
    "nanobanana": {
      "command": "uvx",
      "args": ["nanobanana-mcp-server@latest"],
      "env": {
        "GEMINI_API_KEY": "your-gemini-key"
      }
    },
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": {
        "API_KEY": "your-21st-dev-key"
      }
    }
  }
}
```

For Cursor's `.cursor/mcp.json`, Windsurf's settings, or Antigravity: use the same structure adapted to each IDE's MCP configuration format.
