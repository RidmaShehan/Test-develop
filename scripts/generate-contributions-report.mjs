#!/usr/bin/env node

import { execSync } from "node:child_process";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function run(command) {
  return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    author: "",
    since: "",
    until: "",
    out: "",
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--author" && args[i + 1]) {
      config.author = args[i + 1];
      i += 1;
    } else if (arg === "--since" && args[i + 1]) {
      config.since = args[i + 1];
      i += 1;
    } else if (arg === "--until" && args[i + 1]) {
      config.until = args[i + 1];
      i += 1;
    } else if (arg === "--out" && args[i + 1]) {
      config.out = args[i + 1];
      i += 1;
    }
  }

  return config;
}

function safeSlug(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function buildSummaryForCommit(sha) {
  const files = run(`git show --name-only --pretty=format: ${sha}`)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (files.length === 0) return "Code changes";
  if (files.length === 1) return `Updated ${files[0]}`;
  if (files.length === 2) return `Updated ${files[0]},${files[1]}`;
  return `Updated ${files[0]},${files[1]},${files[2]} and ${files.length - 3} more files`;
}

function buildGitLogCmd({ author, since, until }) {
  const filters = [];
  if (author) filters.push(`--author="${author.replace(/"/g, '\\"')}"`);
  if (since) filters.push(`--since="${since.replace(/"/g, '\\"')}"`);
  if (until) filters.push(`--until="${until.replace(/"/g, '\\"')}"`);

  return [
    "git log --all",
    "--pretty=format:%H%x09%ad%x09%D",
    "--date=short",
    "--shortstat",
    ...filters,
  ].join(" ");
}

function parseCommits(raw) {
  const lines = raw.split("\n");
  const commits = [];
  let current = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    if (/^[0-9a-f]{40}\t/.test(line)) {
      const [sha, date, refsRaw = ""] = line.split("\t");
      const refs = refsRaw
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v && v !== "HEAD");
      current = { sha, date, refs, insertions: 0, deletions: 0 };
      commits.push(current);
      continue;
    }

    if (current && (line.includes("insertion") || line.includes("deletion"))) {
      const ins = line.match(/(\d+)\s+insertion/);
      const del = line.match(/(\d+)\s+deletion/);
      current.insertions = ins ? Number(ins[1]) : 0;
      current.deletions = del ? Number(del[1]) : 0;
    }
  }

  return commits;
}

function refsToBranch(refs) {
  const candidate = refs.find((r) => r.startsWith("origin/") || r.startsWith("refs/heads/") || /^[A-Za-z0-9._/-]+$/.test(r));
  if (!candidate) return "N/A";
  return candidate
    .replace("origin/", "")
    .replace("refs/heads/", "")
    .replace("HEAD -> ", "")
    .trim();
}

function totals(commits) {
  const insertions = commits.reduce((sum, c) => sum + c.insertions, 0);
  const deletions = commits.reduce((sum, c) => sum + c.deletions, 0);
  return { insertions, deletions, total: insertions + deletions };
}

function asPercent(part, whole) {
  if (!whole) return "0.00%";
  return `${((part / whole) * 100).toFixed(2)}%`;
}

function main() {
  const args = parseArgs();
  const author = args.author || run("git config user.name");
  const dateTag = new Date().toISOString().slice(0, 10);
  const outputFile = args.out || `contributions-${safeSlug(author)}-${dateTag}.pdf`;

  const authorRaw = run(buildGitLogCmd(args));
  const authorCommits = parseCommits(authorRaw);
  const allRaw = run(buildGitLogCmd({ since: args.since, until: args.until }));
  const allCommits = parseCommits(allRaw);

  const authorRows = authorCommits.map((c) => {
    const totalChanges = c.insertions + c.deletions;
    return [
      c.date,
      refsToBranch(c.refs),
      buildSummaryForCommit(c.sha),
      String(c.insertions),
      String(c.deletions),
      String(totalChanges),
    ];
  });

  const myTotals = totals(authorCommits);
  const repoTotals = totals(allCommits);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(13);
  doc.text(`contributions-${author}-${dateTag}`, 40, 36);

  autoTable(doc, {
    startY: 54,
    head: [["Date", "Branch", "Commit Summary", "Insertions", "Deletions", "Total Changes"]],
    body: authorRows.length ? authorRows : [["-", "-", "No commits found", "0", "0", "0"]],
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [235, 235, 235], textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 70 },
      2: { cellWidth: 360 },
      3: { halign: "right", cellWidth: 65 },
      4: { halign: "right", cellWidth: 65 },
      5: { halign: "right", cellWidth: 75 },
    },
  });

  const y = doc.lastAutoTable.finalY + 24;
  doc.setFontSize(10);
  doc.text(`TOTAL: ${myTotals.insertions}    ${myTotals.deletions}    ${myTotals.total}`, 40, y);
  doc.text(`Repository Total (${allCommits.length} commits across all branches):`, 40, y + 16);
  doc.text(`${repoTotals.insertions}    ${repoTotals.deletions}    ${repoTotals.total}`, 340, y + 16);
  doc.text(`Your Contribution %: ${asPercent(myTotals.insertions, repoTotals.insertions)}    ${asPercent(myTotals.total, repoTotals.total)}`, 40, y + 32);

  doc.save(outputFile);
  console.log(`Created ${outputFile}`);
}

main();
