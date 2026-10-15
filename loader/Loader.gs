/**
 * Applications API Client
 * https://github.com/Oxara-Assets/applications-api-client
 *
 * This loader retrieves and executes the client at runtime.
 * No manual updates will ever be required.
 */

const APPLICATIONS_CLIENT = Object.freeze({
  VERSION: "1.0.0",
  SOURCE_URL:
    "https://raw.githubusercontent.com/Oxara-Assets/applications-api-client/main/dist/latest.js",
})

/**
 * Executes the remotely hosted client.
 */

function runApplicationClient() {
  const response = UrlFetchApp.fetch(
    APPLICATIONS_CLIENT.SOURCE_URL,
    {
      method: "get",
      followRedirects: true,
      muteHttpExceptions: true,
    }
  );

  const status = response.getResponseCode();

  if (status !== 200) {
    throw new Error(
      `Applications API Client download failed (HTTP ${status}).`
    );
  }

  const source = response.getContentText();

  if (!source.trim()) {
    throw new Error("Applications API Client source is empty.");
  }

  let client;

  try {
    client = new Function(
      `"use strict"; return (${source.trim().replace(/;\s*$/, "")});`
    )();
  } catch (error) {
    throw new Error(
      `Failed to evaluate Applications API Client: ${error.message}`
    );
  }

  if (!client || typeof client.run !== "function") {
    throw new Error(
      "Invalid client source: expected an object exposing run()."
    );
  }

  console.log(
    `Applications API Client v${client.version || "unknown"} loaded.`
  );

  return client.run();
}
