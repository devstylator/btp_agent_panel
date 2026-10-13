sap.ui.require(["sap/ui/core/ComponentContainer"], function (ComponentContainer) {
  new ComponentContainer({
    name: "com.example.agentadmin",
    async: true,
    height: "100%"
  }).placeAt("content");
});
