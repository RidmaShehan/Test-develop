# 🤝 Contributing to Education CRM System

Thank you for considering contributing to this project! This document provides guidelines and instructions for contributors.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Style](#code-style)
4. [Making Changes](#making-changes)
5. [Submitting Changes](#submitting-changes)
6. [Reporting Bugs](#reporting-bugs)
7. [Suggesting Enhancements](#suggesting-enhancements)

---

## Getting Started

Before you begin:
- Read the [README.md](./README.md) to understand the project
- Review the [SETUP_GUIDE.md](./SETUP_GUIDE.md) for setup instructions
- Check existing issues and pull requests to avoid duplication

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/CRM-System.git
cd CRM-System

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL-OWNER/CRM-System.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your local settings
```

### 4. Set Up Database

```bash
npx prisma db push
npx tsx scripts/seed-roles-and-permissions.ts
```

### 5. Start Development Server

```bash
npm run dev
```

### 6. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

---

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define types explicitly (avoid `any` when possible)
- Use interfaces for object shapes
- Use enums for fixed sets of values

**Example:**
```typescript
interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

enum UserRole {
  ADMIN = 'ADMIN',
  COORDINATOR = 'COORDINATOR',
  VIEWER = 'VIEWER'
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use meaningful component and variable names

**Example:**
```typescript
import { useState } from 'react'

interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}
```

### File Naming

- **Components:** `PascalCase.tsx` (e.g., `UserList.tsx`)
- **Utilities:** `camelCase.ts` (e.g., `dateUtils.ts`)
- **API Routes:** `route.ts` in appropriate directory
- **Pages:** Use Next.js conventions

### Code Formatting

We use ESLint for linting:

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(inquiries): add multiple program selection

fix(auth): resolve JWT token expiration issue

docs(setup): update installation instructions

refactor(api): optimize database queries
```

---

## Making Changes

### Adding a New Feature

1. **Check if feature aligns with project goals**
2. **Open an issue to discuss** (for large features)
3. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/feature-name
   ```
4. **Implement the feature**
5. **Test thoroughly**
6. **Update documentation** if needed
7. **Commit your changes**
8. **Push to your fork**

### Fixing a Bug

1. **Verify the bug exists**
2. **Create a branch**:
   ```bash
   git checkout -b fix/bug-description
   ```
3. **Fix the bug**
4. **Test the fix**
5. **Commit and push**

### Database Changes

If your changes affect the database:

1. **Update `prisma/schema.prisma`**
2. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```
3. **Push schema changes**:
   ```bash
   npx prisma db push
   ```
4. **Create/update seed scripts** if needed
5. **Document the changes**

### API Changes

When adding or modifying API endpoints:

1. **Follow REST conventions**
2. **Add proper error handling**
3. **Implement authentication/authorization**
4. **Document the endpoint**
5. **Test with different user roles**

**Example API Route:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth()
    
    // Fetch data
    const data = await prisma.someModel.findMany({
      where: { userId: user.id }
    })
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
```

---

## Submitting Changes

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass (if applicable)
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Code is linted (`npm run lint`)
- [ ] No console errors in browser
- [ ] Tested in development environment

### Pull Request Process

1. **Update your fork**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Reference related issues
   - Provide detailed description of changes
   - Include screenshots/videos if UI changes

4. **Pull Request Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Related Issues
   Fixes #123

   ## Testing
   How has this been tested?

   ## Screenshots (if applicable)
   Add screenshots here

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Documentation updated
   - [ ] Tests added/updated
   - [ ] No breaking changes
   ```

5. **Respond to feedback**
   - Address review comments
   - Make requested changes
   - Push updates to the same branch

---

## Reporting Bugs

### Before Reporting

1. **Check existing issues** to avoid duplicates
2. **Try to reproduce** the bug consistently
3. **Test in latest version**

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable

## Environment
- OS: [e.g., Windows 10, macOS 13]
- Browser: [e.g., Chrome 120, Firefox 121]
- Node Version: [e.g., 18.17.0]
- Application Version: [e.g., 2.0]

## Additional Context
Any other relevant information
```

---

## Suggesting Enhancements

### Enhancement Template

```markdown
## Feature Description
Clear description of the proposed feature

## Problem it Solves
What problem does this solve?

## Proposed Solution
How should this work?

## Alternatives Considered
What other solutions did you consider?

## Additional Context
Any other relevant information

## Priority
- [ ] High
- [ ] Medium
- [ ] Low
```

---

## Code Review Guidelines

### For Reviewers

- Be constructive and respectful
- Explain the "why" behind suggestions
- Distinguish between required changes and suggestions
- Approve when changes meet standards
- Test the changes locally if possible

### For Contributors

- Don't take feedback personally
- Ask questions if feedback is unclear
- Make requested changes promptly
- Thank reviewers for their time
- Mark conversations as resolved

---

## Development Tips

### Useful Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Database GUI
npx prisma studio

# Generate Prisma client
npx prisma generate

# Push database changes
npx prisma db push

# Seed database
npx tsx scripts/seed-roles-and-permissions.ts
```

### Debugging

- Use browser DevTools for frontend issues
- Check server logs for backend issues
- Use `console.log` strategically (remove before committing)
- Use breakpoints in VSCode
- Check Prisma Studio for database state

### Testing

When testing your changes:

1. **Different User Roles**
   - Test as ADMIN
   - Test as COORDINATOR
   - Test as VIEWER

2. **Different Data States**
   - Empty state (no data)
   - With data
   - Edge cases (very long names, special characters)

3. **Different Browsers**
   - Chrome
   - Firefox
   - Safari
   - Edge

4. **Responsive Design**
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)

---

## Project Structure

```
CRM-System/
├── prisma/              # Database schema and migrations
├── public/              # Static files
├── src/
│   ├── app/            # Next.js app directory
│   │   ├── api/        # API routes
│   │   └── */          # Pages
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utility functions
│   └── services/       # Business logic
├── scripts/            # Setup and utility scripts
├── .env.example        # Environment variables template
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

---

## Getting Help

If you need help:

1. Check the [README.md](./README.md)
2. Review [SETUP_GUIDE.md](./SETUP_GUIDE.md)
3. Check existing issues on GitHub
4. Ask in discussions
5. Contact maintainers

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Project documentation (if significant contribution)

---

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**
- Being respectful and inclusive
- Gracefully accepting constructive criticism
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable behavior includes:**
- Harassment, trolling, or discriminatory comments
- Personal or political attacks
- Publishing others' private information
- Other conduct inappropriate in a professional setting

---

**Thank you for contributing to Education CRM System! 🎉**

---

**Version:** 2.0  
**Last Updated:** November 2025

