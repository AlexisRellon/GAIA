<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

---

# GAIA Agent Navigation Guide

## Quick Links to Specialized Instructions

### 🎯 Core Instructions
- **Main Copilot Instructions**: `.github/copilot-instructions.md` - Project overview, architecture, conventions, tech stack
- **OpenSpec Workflow**: `openspec/AGENTS.md` - Proposal creation, spec management, change tracking

### 🛠️ MCP Tools Documentation

#### Overview & Reference
- **MCP Tools Overview**: `.github/copilot-mcp-tools.md` - Comprehensive guide to all available MCP tools, when to use them, and integration patterns

#### Context-Specific Guides
- **Frontend MCP Guide**: `frontend/COPILOT_INSTRUCTIONS.md` - Figma-to-code, ShadCN UI components, frontend security testing
- **Backend MCP Guide**: `backend/COPILOT_INSTRUCTIONS.md` - Hugging Face model integration, Supabase operations, AI pipeline development
- **Full-Stack Workflows**: `.github/copilot-mcp-workflows.md` - End-to-end feature implementation patterns combining multiple MCP tools

### 📋 When to Use Which Guide

**📝 Creating Documentation?**
→ **ALWAYS use `docs/` directory structure**
- Setup guides → `docs/setup/`
- Security docs → `docs/security/`
- Implementation logs → `docs/implementation/archive/`
- Analysis → `docs/research/`
- How-to guides → `docs/guides/`
- **UPDATE** `docs/README.md` after adding new files
- See [Documentation Guidelines](.github/copilot-instructions.md#documentation-guidelines)

**Working on Frontend (GV-0x, FP-0x, CR-01, CD-01)?**
→ Open `frontend/COPILOT_INSTRUCTIONS.md`
- Figma design extraction
- ShadCN component discovery
- React/TypeScript patterns
- Frontend security testing

**Working on Backend (AI Pipeline, Data Processing)?**
→ Open `backend/COPILOT_INSTRUCTIONS.md`
- Hugging Face model search
- Supabase database operations
- Python AI/ML implementation
- API security testing

**Implementing Complete Features?**
→ Open `.github/copilot-mcp-workflows.md`
- Cross-stack integration patterns
- Complete feature workflows
- Testing strategies
- Security best practices

**Planning New Capabilities?**
→ Open `openspec/AGENTS.md`
- Creating proposals
- Writing specs
- Change management
- Architecture decisions

**General Project Context?**
→ Open `.github/copilot-instructions.md`
- Tech stack details
- Module codes
- Development workflow
- Docker environment

### 🔍 MCP Tools Quick Reference

| Tool | Primary Use | Guide Location |
|------|------------|----------------|
| **Figma MCP** | Design-to-code conversion | `frontend/COPILOT_INSTRUCTIONS.md` |
| **ShadCN MCP** | UI component discovery | `frontend/COPILOT_INSTRUCTIONS.md` |
| **Hugging Face MCP** | AI model integration | `backend/COPILOT_INSTRUCTIONS.md` |
| **Supabase MCP** | Database & backend ops | `backend/COPILOT_INSTRUCTIONS.md` |
| **StackHawk MCP** | Security testing | Both frontend & backend guides |
| **Context7 MCP** | Documentation lookup | All guides |

### 💡 Usage Tips

1. **Starting a new feature?** Check the full-stack workflow guide first for the complete pattern
2. **Stuck on implementation?** Use Context7 MCP to get up-to-date library documentation
3. **Need UI components?** Search with ShadCN MCP before building custom components
4. **Integrating AI models?** Search Hugging Face MCP for pre-trained models
5. **Before deploying?** Run StackHawk MCP security scans on all endpoints
6. **Database changes?** Use Supabase MCP to apply migrations and check security advisors

### 🚀 Common Workflows

**New UI Component:**
```
1. Check Figma MCP for design
2. Search ShadCN MCP for components
3. Get docs with Context7 MCP
4. Scan with StackHawk MCP
→ See: frontend/COPILOT_INSTRUCTIONS.md
```

**New AI Model:**
```
1. Search Hugging Face MCP for models
2. Get docs with Context7 MCP
3. Store in Supabase MCP
4. Test with StackHawk MCP
→ See: backend/COPILOT_INSTRUCTIONS.md
```

**Complete Feature:**
```
1. Follow workflow pattern
2. Use appropriate MCP tools
3. Test across stack
4. Security scan everything
→ See: .github/copilot-mcp-workflows.md
```

---

**Remember**: All MCP tool usage must account for Docker containerized development. Always reference services by name, test in containers, and rebuild when dependencies change.