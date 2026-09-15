import { execSync } from "child_process";

function run(cmd: string) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

run("pnpm db:migrate");
run("pnpm db:seed");
console.log("Bootstrap complete.");
