
/**
 * Applications API Client
 * https://github.com/Oxara-Assets/applications-api-client
 *
 * This loader retrieves and executes the latest published client.
 * The client is fetched at runtime and is not saved locally.
 */

const APPLICATIONS_CLIENT = Object.freeze({
  RELEASES_URL:
    "https://api.github.com/repos/Oxara-Assets/applications-api-client/releases/latest",
  ASSET_NAME: "latest.js",
});

/**
 * Downloads and initialises the latest published client.
 */
function loadApplicationsClient() {
  const releaseResponse = UrlFetchApp.fetch(
    APPLICATIONS_CLIENT.RELEASES_URL,
    {
      method: "get",
      headers: {
        Accept: "application/vnd.github+json",
      },
      muteHttpExceptions: true,
    }
  );

  if (releaseResponse.getResponseCode() !== 200) {
    throw new Error(
      `Unable to retrieve the latest client release (HTTP ${releaseResponse.getResponseCode()}).`
    );
  }

  const release = JSON.parse(releaseResponse.getContentText());

  const asset = (release.assets || []).find(
    item => item.name === APPLICATIONS_CLIENT.ASSET_NAME
  );

  if (!asset || !asset.browser_download_url) {
    throw new Error(
      `Release ${release.tag_name} does not contain ${APPLICATIONS_CLIENT.ASSET_NAME}.`
    );
  }

  const sourceResponse = UrlFetchApp.fetch(
    asset.browser_download_url,
    {
      method: "get",
      muteHttpExceptions: true,
    }
  );

  if (sourceResponse.getResponseCode() !== 200) {
    throw new Error(
      `Unable to download client asset (HTTP ${sourceResponse.getResponseCode()}).`
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
    `Loaded Applications API Client ${release.tag_name}.`
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
 * Installs the form submission trigger.
 *
 * Run this function manually once after configuring Script Properties.
 */
function setupApplicationsFormTrigger() {
  const properties = PropertiesService.getScriptProperties();
  const formId = properties.getProperty("APPLICATIONS_FORM_ID");

  if (!formId) {
    throw new Error(
      "Set APPLICATIONS_FORM_ID in Script Properties first."
    );
  }

  const form = FormApp.openById(formId);

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
    `Submission trigger installed for form ${formId}.`
  );
}
