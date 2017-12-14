let submitButton, statusList, integrationDetails;

// const scenarios = [{
//   title: "Create Integration"
// }, {
//   title: "Create Integration with Table Selection"
// }, {
//   title: "Authorize existing Integration"
// }]

function buttonClicked1() {
  submitButton.disabled = true;
  statusList.className = "status status--in-progress";
  integrationDetails.textContent = "";
  window.Stitch.addSourceIntegration("platform.hubspot", function(result) {
    submitButton.disabled = false;
    if (result) {
      statusList.className = "status status--success";
      integrationDetails.textContent = "(id: " + result.id + ")";
    } else {
      statusList.className = "status status--failed";
    }
  }, {"campaigns": true});
}

function buttonClicked2() {
  submitButton.disabled = true;
  statusList.className = "status status--in-progress";
  integrationDetails.textContent = "";
  window.Stitch.addSourceIntegration("platform.hubspot", function(result) {
    submitButton.disabled = false;
    if (result) {
      statusList.className = "status status--success";
      integrationDetails.textContent = "(id: " + result.id + ")";
    } else {
      statusList.className = "status status--failed";
    }
  }, {"default_selections" : {"campaigns": true, "companies" : true},
      'ephemeral_token': 'some-ephemeral-token'});
}

function authorize() {
  submitButton.disabled = true;
  statusList.className = "status status--in-progress";
  integrationDetails.textContent = "";
  window.Stitch.addSourceIntegrationNew(window.Stitch.SOURCE_INTEGRATION_STEPS.CREATE, {
    type: "platform.wootric"
  },
  // window.Stitch.addSourceIntegrationNew(window.Stitch.SOURCE_INTEGRATION_STEPS.AUTHORIZE, {
  //   id: 9
  // },
  // window.Stitch.addSourceIntegrationNew(window.Stitch.SOURCE_INTEGRATION_STEPS.CHECK, {
  //   id: 9,
  //   check_job_name: "3-9-1513262772026-checks"
  // },
  // window.Stitch.addSourceIntegrationNew(window.Stitch.SOURCE_INTEGRATION_STEPS.SELECT_FIELDS, {
  //   id: 9
  // },

  function(result) {
    console.log("callback", result);
  // window.Stitch.authorize(9, function(result) {
    submitButton.disabled = false;
    if (result) {
      statusList.className = "status status--success";
      // integrationDetails.textContent = "(id: " + result.id + ")";
      integrationDetails.textContent = JSON.stringify(result);
    } else {
      statusList.className = "status status--failed";
    }
  }, {"default_selections" : {"campaigns": true, "companies" : true},
      'ephemeral_token': 'some-ephemeral-token'});
}

document.addEventListener("DOMContentLoaded", () => {
  submitButton = document.getElementById("submit");
  statusList = document.querySelector(".status");
  integrationDetails = document.getElementById("integration-details");
  submitButton.addEventListener("click", authorize);
});
