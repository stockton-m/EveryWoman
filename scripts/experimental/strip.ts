import fs from "node:fs";
import path from "node:path";
import { API, type Program } from "typescript/unstable/sync";
import { createVirtualFileSystem, type FileSystem } from "typescript/unstable/fs";
import {
  isIdentifier,
  isImportDeclaration,
  isJsxElement,
  isJsxSelfClosingElement,
  isNamedImports,
  isNamespaceImport,
  isPropertyAccessExpression,
  isStringLiteral,
  SyntaxKind,
  type ImportDeclaration,
  type JsxTagNameExpression,
  type Node,
  type SourceFile,
} from "typescript/unstable/ast";

/** First non-empty line that marks a module as experimental. */
export const EXPERIMENTAL_DIRECTIVE = "// @experimental";

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"];
const VIRTUAL_FILE = "/virtual/input.tsx";
const VIRTUAL_PROJECT = "/virtual/tsconfig.json";

type Edit = {
  start: number;
  end: number;
  text: string;
};

type Session = {
  api: API;
  virtualFs: FileSystem;
  opened: boolean;
};

let session: Session | undefined;

export function closeExperimentalParser(): void {
  session?.api.close();
  session = undefined;
}

export function isExperimentalSource(code: string): boolean {
  for (const line of code.split(/\r?\n/)) {
    if (line.trim() === "") continue;
    return line.trim() === EXPERIMENTAL_DIRECTIVE;
  }
  return false;
}

export function isExperimentalFile(file: string): boolean {
  try {
    return isExperimentalSource(fs.readFileSync(file, "utf8"));
  } catch {
    return false;
  }
}

export function findExperimentalFiles(root: string): string[] {
  const srcDir = path.join(root, "src");
  if (!fs.existsSync(srcDir)) return [];

  const found: string[] = [];
  for (const entry of fs.readdirSync(srcDir, { recursive: true })) {
    const relative = entry.toString();
    if (!SOURCE_EXTENSIONS.includes(path.extname(relative))) continue;
    const file = path.join(srcDir, relative);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(file);
    } catch {
      continue;
    }
    if (stat.isFile() && isExperimentalFile(file)) found.push(file);
  }
  return found;
}

export function withExperimentalSourceExclusions(
  css: string,
  root: string,
  cssFile: string,
): string {
  const lines = findExperimentalFiles(root)
    .map((file) => {
      let relative = path.relative(path.dirname(cssFile), file).split(path.sep).join("/");
      if (!relative.startsWith(".")) relative = `./${relative}`;
      return `@source not '${relative}';`;
    })
    .filter((line) => !css.includes(line));
  if (lines.length === 0) return css;
  return `${css.replace(/\s*$/, "")}\n${lines.join("\n")}\n`;
}

export function sourceSyntaxError(code: string): string {
  return withSource(code, (_source, program) =>
    program
      .getSyntacticDiagnostics(VIRTUAL_FILE)
      .map((diagnostic) => diagnostic.text)
      .join("\n"),
  );
}

export function stripExperimentalImports(code: string, importer: string, root: string): string {
  return withSource(code, (sourceFile) => {
    const bindings = new Set<string>();
    const edits: Edit[] = [];

    for (const statement of sourceFile.statements) {
      if (!isImportDeclaration(statement)) continue;
      const removal = experimentalImportEdit(statement, sourceFile, importer, root);
      if (!removal) continue;
      edits.push(removal.edit);
      for (const binding of removal.bindings) bindings.add(binding);
    }

    if (bindings.size > 0) collectJsxEdits(sourceFile, bindings, edits);
    if (edits.length === 0) return code;
    return applyEdits(code, edits);
  });
}

function getSession(): Session {
  if (session) return session;
  const virtualFs = createVirtualFileSystem({
    [VIRTUAL_PROJECT]: `{
      "compilerOptions": {
        "jsx": "react-jsx",
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "strict": false,
        "noEmit": true,
        "skipLibCheck": true
      },
      "files": ["input.tsx"]
    }`,
    [VIRTUAL_FILE]: "",
  });
  session = { api: new API({ fs: virtualFs, cwd: "/virtual" }), virtualFs, opened: false };
  return session;
}

function withSource<T>(code: string, use: (source: SourceFile, program: Program) => T): T {
  const current = getSession();
  if (!current.virtualFs.writeFile) {
    throw new Error("The experimental-content parser could not read the source file.");
  }
  current.virtualFs.writeFile(VIRTUAL_FILE, code);
  const snapshot = current.api.updateSnapshot(
    current.opened
      ? { fileChanges: { changed: [VIRTUAL_FILE] } }
      : { openProjects: [VIRTUAL_PROJECT] },
  );
  current.opened = true;
  const project = snapshot.getDefaultProjectForFile(VIRTUAL_FILE);
  const source = project?.program.getSourceFile(VIRTUAL_FILE);
  if (!project || !source || source.text !== code) {
    throw new Error("The experimental-content parser could not read the source file.");
  }
  return use(source, project.program);
}

function experimentalImportEdit(
  node: ImportDeclaration,
  sourceFile: SourceFile,
  importer: string,
  root: string,
): { edit: Edit; bindings: string[] } | null {
  if (!isStringLiteral(node.moduleSpecifier)) return null;
  if (node.importClause?.phaseModifier === SyntaxKind.TypeKeyword) return null;

  const resolved = resolveImport(node.moduleSpecifier.text, importer, root);
  if (!resolved || !isExperimentalFile(resolved)) return null;

  const clause = node.importClause;
  if (!clause) return { edit: deletion(node), bindings: [] };

  const named = clause.namedBindings && isNamedImports(clause.namedBindings) ? clause.namedBindings.elements : [];
  const valueSpecifiers = named.filter((specifier) => !specifier.isTypeOnly);
  const typeSpecifiers = named.filter((specifier) => specifier.isTypeOnly);
  const hasDefault = clause.name !== undefined;
  const hasNamespace = Boolean(clause.namedBindings && isNamespaceImport(clause.namedBindings));
  if (!hasDefault && !hasNamespace && valueSpecifiers.length === 0) return null;

  const bindings: string[] = [];
  if (clause.name) bindings.push(clause.name.text);
  if (clause.namedBindings && isNamespaceImport(clause.namedBindings)) {
    bindings.push(clause.namedBindings.name.text);
  }
  for (const specifier of valueSpecifiers) bindings.push(specifier.name.text);

  if (typeSpecifiers.length > 0 && !hasDefault && !hasNamespace) {
    const kept = typeSpecifiers.map((specifier) => specifier.getText(sourceFile)).join(", ");
    const specifierText = node.moduleSpecifier.getText(sourceFile);
    return {
      edit: {
        start: node.getStart(sourceFile),
        end: node.getEnd(),
        text: `import { ${kept} } from ${specifierText};`,
      },
      bindings,
    };
  }

  return { edit: deletion(node), bindings };
}

function deletion(node: Node): Edit {
  return { start: node.getFullStart(), end: node.getEnd(), text: "" };
}

function collectJsxEdits(node: Node, bindings: Set<string>, edits: Edit[]): void {
  if (isJsxSelfClosingElement(node) && tagMatches(node.tagName, bindings)) {
    edits.push(deletion(node));
    return;
  }
  if (isJsxElement(node) && tagMatches(node.openingElement.tagName, bindings)) {
    edits.push(deletion(node));
    return;
  }
  node.forEachChild((child) => collectJsxEdits(child, bindings, edits));
}

function tagMatches(tag: JsxTagNameExpression, bindings: Set<string>): boolean {
  if (isIdentifier(tag)) return bindings.has(tag.text);
  return isPropertyAccessExpression(tag) && isIdentifier(tag.expression) && bindings.has(tag.expression.text);
}

function resolveImport(specifier: string, importer: string, root: string): string | null {
  if (specifier.startsWith("@/")) {
    return resolveFile(path.join(root, "src", specifier.slice(2)));
  }
  if (specifier.startsWith(".")) {
    return resolveFile(path.resolve(path.dirname(importer), specifier));
  }
  return null;
}

function resolveFile(base: string): string | null {
  const candidates = [
    base,
    ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => path.join(base, `index${extension}`)),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

function applyEdits(code: string, edits: Edit[]): string {
  const sorted = [...edits].sort((left, right) => right.start - left.start || right.end - left.end);
  let next = code;
  for (const edit of sorted) {
    next = next.slice(0, edit.start) + edit.text + next.slice(edit.end);
  }
  return next;
}
