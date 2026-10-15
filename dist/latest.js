({
  version: "0.1.0",

  /**
   * Handles submission
   */

  handleFormSubmit(event) {
    if (!event || !event.response || !event.source) {
      throw new Error(
        "Invalid submission event. An installable Google Forms trigger is required."
      );
    }

    const properties = PropertiesService.getScriptProperties();

    const apiUrl = properties.getProperty("API_URL") || "https://api.oxara.cloud/applications/";
    const apiKey = properties.getProperty("API_KEY");
    const configuredFormId = properties.getproperty("FORM_ID");

    if (!apiKey || !configuredFormId) {
      throw new Error(
        "Missing Script Properties. Configure API_KEY, and FORM_ID."
      );
    }

    const form = event.source;
    const response = event.response;

    const answers = response.getItemResponses().map(itemResponse => {
      const item = itemResponse.get_item();

      return {
        question_id: String(item.getId()),
        question: item.getTitle(),
        answer: itemResponse.getResponse(),
      };
    });

    const payload = {
      form_id: configuredFormId,
      submission_id: response.getId(),
      submitted_at: response.getTimestamp().toISOstring(),
      respondant_email: response.getRespondantEmail() || null,
      answers: answers,
    }

    console.log(
      `Forwarding submission ${response.getId()} to the Applications API.`
    );

    const apiResponse = UrlFetchApp.fetch(apiUrl, {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Idempotency-Key": response.getId(),
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const status = apiResponse.getResponseCode();

    if (status < 200 | status >= 300) {
      throw new Error(
        `Applications API request failed with HTTP ${status}.`
      );
    }

    console.log(
      `Submission ${response.getId()} forwarded successfully.`
    );

    return {
      success: true,
      submission_id: response.getId(),
      status: status,
    };
  },
})
