import React, { useMemo, useState } from 'react';

const Section = ({ title, children }) => (
  <div className="docs-section glass-panel">
    <div className="docs-section-title">{title}</div>
    <div className="docs-section-body">{children}</div>
  </div>
);

const Cmd = ({ children }) => <code className="docs-cmd">{children}</code>;

export default function Docs() {
  const [query, setQuery] = useState('');

  const items = useMemo(() => ([
    {
      title: 'Quick start',
      body: (
        <>
          <ul className="docs-list">
            <li><b>Select a repo</b>: open <b>Workspace</b> → <b>Repository & Status</b> → <b>Browse Location</b>.</li>
            <li><b>Check status</b>: type <Cmd>status</Cmd>.</li>
            <li><b>Upload code</b> (stage → commit → push): type <Cmd>upload my code</Cmd>.</li>
            <li><b>See graph</b>: the bottom panel shows commit topology; it refreshes when you change repos or run actions.</li>
          </ul>
        </>
      )
    },
    {
      title: 'Core commands (safe defaults)',
      body: (
        <>
          <ul className="docs-list">
            <li><Cmd>status</Cmd> — show staged/modified/untracked/deleted.</li>
            <li><Cmd>upload my code</Cmd> — runs <Cmd>git add .</Cmd>, then commit, then push. If nothing is staged it will stop and tell you.</li>
            <li><Cmd>list branches</Cmd> — shows local + remote branches.</li>
            <li><Cmd>switch to &lt;branch&gt;</Cmd> — checkout a branch.</li>
            <li><Cmd>create branch &lt;name&gt;</Cmd> — create and checkout a new branch.</li>
          </ul>
        </>
      )
    },
    {
      title: 'Sync from remote',
      body: (
        <>
          <ul className="docs-list">
            <li><Cmd>fetch</Cmd> — <Cmd>git fetch --prune origin</Cmd>.</li>
            <li><Cmd>pull</Cmd> — pulls using rebase (<Cmd>git pull --rebase</Cmd>) but will block if your working tree isn’t clean.</li>
          </ul>
        </>
      )
    },
    {
      title: 'Merging & rebasing',
      body: (
        <>
          <ul className="docs-list">
            <li><Cmd>merge &lt;branch&gt;</Cmd> — merges into current branch (blocks if working tree isn’t clean).</li>
            <li><Cmd>rebase onto &lt;branch&gt;</Cmd> — rebases current branch onto another (blocks if working tree isn’t clean).</li>
            <li><Cmd>abort rebase</Cmd> — abort an in-progress rebase.</li>
          </ul>
          <div className="docs-note">
            <b>Conflicts</b>: if you hit conflicts, resolve files in your editor, then run <Cmd>git add .</Cmd> and continue with Git (rebase/merge continue).
            Automatic conflict resolution is risky; this agent keeps you safe by explaining exact next steps.
          </div>
        </>
      )
    },
    {
      title: 'Cherry-pick',
      body: (
        <>
          <ul className="docs-list">
            <li><Cmd>cherry-pick &lt;hash&gt;</Cmd> — applies a specific commit to your current branch (blocks if working tree isn’t clean).</li>
            <li><Cmd>abort cherry-pick</Cmd> — abort an in-progress cherry-pick.</li>
          </ul>
        </>
      )
    },
    {
      title: 'Branching workflow (recommended)',
      body: (
        <>
          <ol className="docs-list">
            <li>Create a branch: <Cmd>create branch feature/my-change</Cmd></li>
            <li>Make edits in your repo.</li>
            <li>Upload: <Cmd>upload my code</Cmd></li>
            <li>Open a PR (GitHub): use the GitHub UI or <Cmd>gh pr create</Cmd> in your terminal.</li>
            <li>Merge (GitHub), then back to main and pull.</li>
          </ol>
        </>
      )
    },
    {
      title: 'Troubleshooting',
      body: (
        <>
          <ul className="docs-list">
            <li><b>No commits shown</b>: confirm you selected the correct repo folder and it’s a Git repo (you should see branch name).</li>
            <li><b>Upload says “Nothing staged”</b>: you didn’t change files inside the selected repo folder, or your changes are ignored by <Cmd>.gitignore</Cmd>.</li>
            <li><b>Remote shows no changes</b>: check remote URL in the status panel; push may be “Everything up-to-date”.</li>
          </ul>
        </>
      )
    }
  ]), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => i.title.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="docs">
      <div className="docs-header glass-panel">
        <div>
          <div className="docs-title">User manual</div>
          <div className="docs-subtitle">Everything you can do in this Git AI workspace.</div>
        </div>
        <input
          className="docs-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search docs… (e.g. rebase, cherry-pick, upload)"
        />
      </div>

      <div className="docs-grid">
        {filtered.map((s) => (
          <Section key={s.title} title={s.title}>
            {s.body}
          </Section>
        ))}
        {filtered.length === 0 && (
          <div className="docs-empty glass-panel">
            No matches. Try “merge”, “pull”, or “upload”.
          </div>
        )}
      </div>
    </div>
  );
}

