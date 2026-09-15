import { execSync } from "child_process";

function run(cmd: string) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

run("pnpm db:migrate");
run("pnpm db:seed");
run("next start");
