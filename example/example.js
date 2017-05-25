let submitButton, statusLabel;

function buttonClicked() {

  submitButton.disabled = true;
  statusLabel.textContent = "Waiting...";
  window.Stitch.addIntegration("adroll", (result) => {
    submitButton.disabled = false;
    if (result) {
      statusLabel.textContent = `Integration created, type=${result.type}, id=${result.id}`;
    } else {
      statusLabel.textContent = "Integration not created.";
    }
  });

}

document.addEventListener("DOMContentLoaded", () => {
  submitButton = document.getElementById("submit");
  statusLabel = document.getElementById("status");
  submitButton.addEventListener("click", buttonClicked);
});
