let submitButton, statusList, integrationDetails;

function buttonClicked() {

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

document.addEventListener("DOMContentLoaded", () => {
  submitButton = document.getElementById("submit");
  statusList = document.querySelector(".status");
  integrationDetails = document.getElementById("integration-details");
  submitButton.addEventListener("click", buttonClicked);
});
