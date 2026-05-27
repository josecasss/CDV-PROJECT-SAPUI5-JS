sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("quizzapp.cdvproject.controller.View1", {
        
        onAnswer: function (oEvent) {
            // Capturamos el texto del botón presionado
            var sSelected = oEvent.getSource().getText();
            
            if (sSelected === "TypeScript") {
                MessageToast.show("¡Correcto! Eres un pro.");
            } else {
                MessageToast.show("Error, intenta de nuevo.");
            }
        }
        
    });
});