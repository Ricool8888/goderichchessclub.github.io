(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var questions = document.querySelectorAll(".faq-question");
    questions.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".faq-item");
        var wasOpen = item.classList.contains("open");
        item.classList.toggle("open", !wasOpen);
        btn.setAttribute("aria-expanded", String(!wasOpen));
      });
    });
  });
})();
