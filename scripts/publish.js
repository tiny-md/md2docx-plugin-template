/**
 * allow only patch changes from release branches.
 * Major and minor changes allowed only from main branch.
 * pre-release only from branch containing dev or alpha in the branchname
 */

/** Let the following error be thrown by npm. There are situations where publish could have failed for different reasons. */
// throws an exception if process.env.oldv === process.env.v The library version is not up to date, error(" Not able to release to the same version.

const { exec } = require("child_process");

const BRANCH = process.env.BRANCH;
const DEFAULT_BRANCH = process.env.DEFAULT_BRANCH;

const OLD_VERSION = require("./lib/package.json").version;
/** Apply changeset */
exec("pnpm changeset version");
const NEW_VERSION = require("./lib/package.json").version;

const [newMajor, newMinor] = NEW_VERSION.split(".");
const [oldMajor, oldMinor] = OLD_VERSION.split(".");

const isNotPatch = newMajor !== oldMajor && newMinor !== oldMinor;
const isLatestRelease = BRANCH.includes("release-");

const pushCmd = `git add . && git commit -m "📃 Apply changesets and update CHANGELOG" && git push origin ${BRANCH}`;

let tag = "latest";

if (isNotPatch && BRANCH === DEFAULT_BRANCH) {
  /** Create new release branch for every Major or Minor release */
  const releaseBranch = `release-${newMajor}.${newMinor}`;
  exec(pushCmd);
  exec(`git checkout -b ${releaseBranch} && git push origin ${releaseBranch}`);
} else if (isLatestRelease) {
  /** New version must be valid SEMVER version. No pre-release (beta/alpha etc.) */
  if (!/^\d+\.\d+.\d+$/.test(NEW_VERSION)) throw new Error("Invalid version");

  if (isNotPatch)
    throw new Error("Major or Minor changes can be published only from the default branch.");

  // Push changes back to the repo
  exec(pushCmd);
} else {
  exec(pushCmd);
  /** pre-release branch name should be the tag name (e.g., beta, canery, etc.) or tag name followed by a '-' and version or other specifiers. e.g. beta-2.0 */
  tag = BRANCH.split("-")[0];
}

/** Create release */
exec(`cd lib && pnpm build && npm publish --provenance --access public --tag ${tag}`);

/** Create GitHub release */
exec(
  `gh release create ${NEW_VERSION} --generate-notes${isLatestRelease ? " --latest" : ""} -n "$(sed '1,/^## /d;/^## /,$d' CHANGELOG.md)" --title "Release ${NEW_VERSION}"`,
);
