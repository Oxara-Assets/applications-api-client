
/**
 * Applications API Client
 * https://github.com/Oxara-Assets/applications-api-client
 *
 * This loader retrieves and executes the latest published client.
 */

const APPLICATIONS_CLIENT = Object.freeze({
  SOURCE_URL:
    "https://raw.githubusercontent.com/Oxara-Assets/applications-api-client/main/dist/latest.js",
});

/**
 * Downloads and initialises the latest published client.
 */
function loadApplicationsClient() {
  const sourceResponse = UrlFetchApp.fetch(
    APPLICATIONS_CLIENT.SOURCE_URL,
    {
      method: "get",
      muteHttpExceptions: true,
    }
  );

  const status = sourceResponse.getResponseCode();

  if (status !== 200) {
    throw new Error(
      `Unable to download the latest client (HTTP ${status}).`
    );
  }

  const source = sourceResponse.getContentText();

  if (!source.trim()) {
    throw new Error("Downloaded client source is empty.");
  }

  let client;

  try {
    client = new Function(
      `"use strict"; return (${source.trim().replace(/;\s*$/, "")});`
    )();
  } catch (error) {
    throw new Error(
      `Unable to evaluate client source: ${error.message}`
    );
  }

  if (
    !client ||
    typeof client.handleFormSubmit !== "function"
  ) {
    throw new Error(
      "Invalid client: expected handleFormSubmit()."
    );
  }

  console.log(
    `Loaded Applications API Client ${client.version || "unknown"}.`
  );

  return client;
}

/**
 * Receives Google Forms submission events.
 *
 * This function is called automatically by the installed trigger.
 */
function handleApplicationFormSubmit(event) {
  return loadApplicationsClient().handleFormSubmit(event);
}

/**
 * Installs the form submission trigger for the Google Form this script is
 * bound to. Run this function manually once from that form's script editor.
 *
 */
function setupApplicationsFormTrigger() {
  const form = FormApp.getActiveForm();

  if (!form) {
    throw new Error(
      "No active Google Form found. Open the Apps Script project from the Google Form and run setupApplicationsFormTrigger() there."
    );
  }

  // Remove duplicate triggers for this handler.
  ScriptApp.getProjectTriggers()
    .filter(trigger =>
      trigger.getHandlerFunction() ===
      "handleApplicationFormSubmit"
    )
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger("handleApplicationFormSubmit")
    .forForm(form)
    .onFormSubmit()
    .create();

  console.log(
    `Submission trigger installed for Google Form ${form.getId()}.`
  );
}
