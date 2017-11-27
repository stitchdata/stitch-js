let submitButton, statusList, integrationDetails;

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
      'ephemeral_token': 'f505dd7eef4cca69f3d3fdc76c35abd4cfec5b3dab9375fb40d3c128997d975d'});
}

document.addEventListener("DOMContentLoaded", () => {
  submitButton = document.getElementById("submit");
  statusList = document.querySelector(".status");
  integrationDetails = document.getElementById("integration-details");
  submitButton.addEventListener("click", buttonClicked2);
});
