const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔄 Starting lockfile update process...");

try {
  // Run pnpm install with no frozen lockfile to update the lockfile
  console.log("📦 Running npm install to update lockfile...");
  execSync("pnpm install --no-frozen-lockfile", { stdio: "inherit" });

  console.log("✅ Lockfile updated successfully!");
  console.log("🚀 You can now deploy your application with Vercel.");
} catch (error) {
  console.error("❌ Error updating lockfile:", error.message);
  process.exit(1);
}
