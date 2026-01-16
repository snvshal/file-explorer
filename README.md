# File Explorer (SNFE)

A beautiful, minimal web application for quickly exploring and previewing files from GitHub repositories and local directories. Built with Next.js, TypeScript, and modern web standards.

## Features

- **GitHub Repository Exploration** - Paste any public GitHub repository URL to instantly browse its file structure
- **Local Directory Browsing** - Use the File System Access API to securely explore your local file system
- **Direct URL Navigation** - Visit URLs like `/https://github.com/owner/repo/blob/main/file.tsx` to open files directly
- **Syntax Highlighting** - Professional code syntax highlighting using Shiki for 140+ programming languages
- **Markdown Rendering** - Full markdown support with proper image and link parsing for both GitHub and local files
- **Media Preview** - View images, videos, and audios directly in the application with proper aspect ratios
- **Dark & Light Mode** - Beautiful theme toggle that persists your preference
- **File Management**
  - Copy file contents to clipboard with one click
  - Toggle code wrapping for long lines
  - Toggle between markdown preview and raw code view
  - Human-readable file sizes (KB, MB, GB)

## Tech Stack

- **Framework**: Next.js 16.0 with App Router
- **Runtime**: React 19.2 with Server Components
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Tailwind Animate
- **UI Components**: shadcn/ui with Radix UI
- **Code Highlighting**: Shiki (server-side highlighting)
- **Markdown Parsing**: Marked with custom renderers
- **Theme Management**: next-themes
- **Icons**: Lucide React
- **File System**: File System Access API with localStorage fallback

## Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Git

### Installation

#### Using Bun (Recommended)

```bash
# Clone the repository
git clone https://github.com/snvshal/file-explorer.git
cd file-explorer

# Install dependencies with Bun
bun install

# Start the development server
bun run dev
```

#### Using npm/yarn

```bash
# Install dependencies
npm install
# or
yarn install

# Start the development server
npm run dev
# or
yarn dev
```

The application will start at `http://localhost:3000`

### Build for Production

```bash
# Using Bun
bun run build
bun start

# Using npm/yarn
npm run build
npm start
```

## Usage

### Exploring GitHub Repositories

1. Enter a GitHub repository URL in the input field
   - Supported formats:
     - `https://github.com/owner/repo`
     - `owner/repo` (auto-prefixed with GitHub URL)
2. Click "Explore" or press Enter
3. Browse the file tree in the left sidebar
4. Click any file to preview its contents in the right panel
5. Images and markdown content render with proper formatting

### Direct GitHub URL Navigation

You can navigate directly to specific files using URLs:

- `http://localhost:3000/https://github.com/owner/repo/blob/main/src/file.tsx`
- `http://localhost:3000/https://github.com/owner/repo/blob/main/README.md`

The app will automatically:

1. Parse the repository and file path
2. Fetch the repository structure
3. Select and display the specified file

### Exploring Local Directories

1. Click the "Upload Directory" button
2. Select a folder using the File System Access API picker
3. Grant permission to access the directory (read-only)
4. Browse your local files just like GitHub repositories

### Viewing Files

- **Code Files**: Syntax-highlighted with Shiki. Toggle word-wrap with the wrap button
- **Markdown Files** (.md):
  - Toggle between beautiful formatted preview and raw source code
  - Images with relative paths load correctly (both GitHub and local files)
  - Links open in new tabs
- **Images**: Displayed with proper sizing and aspect ratio
- **Videos**: Playable with native video controls
- **Audios**: Playable with native audio controls
- **Other Files**: Show raw content with human-readable file sizes

## Browser Support

| Feature                    | Chrome | Firefox | Safari | Edge |
| -------------------------- | ------ | ------- | ------ | ---- |
| File System Access API     | ✅     | ⏳      | ⏳     | ✅   |
| Fallback (webkitdirectory) | ✅     | ✅      | ✅     | ✅   |
| localStorage               | ✅     | ✅      | ✅     | ✅   |
| Theme Persistence          | ✅     | ✅      | ✅     | ✅   |

**Note**: The File System Access API is the primary method for local file access. Older browsers fall back to `webkitdirectory` input, which is more limited but functional.

## Performance Optimizations

- Server-side syntax highlighting with Shiki
- Image lazy loading in markdown
- Efficient recursive directory traversal with proper sorting
- Minimal JavaScript bundle size
- Blob URLs for local file images (no re-encoding)

## Data Privacy

- **GitHub Files**: Fetched directly from GitHub's public API (no data stored on servers)
- **Local Files**: Processed entirely in your browser using File System Access API
- **No tracking**: No analytics or user tracking implemented
- **Theme preference**: Stored in browser localStorage only

## Known Limitations

- GitHub public repositories only (private repos require authentication)
- File System Access API not yet supported in Firefox and Safari (uses fallback)
- Very large directories (10,000+ files) may take time to process
- GitHub API rate limiting: 60 requests/hour for unauthenticated requests

## Future Enhancements

- Upstash Redis integration for GitHub API rate limit caching
- OAuth for GitHub private repository access
- Search within files functionality
- File diff viewer for repositories
- Terminal-like file browser interface
- Export repository as ZIP
- Support for Git submodules
- Code statistics and analytics
- Syntax-aware code search
- Collaborative file sharing via URLs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
