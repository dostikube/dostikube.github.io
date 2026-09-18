(function () {
  "use strict";
  if (sessionStorage.getItem("dostikube-access") !== "granted") {
    location.replace(new URL("../", location.href));
  }
})();
