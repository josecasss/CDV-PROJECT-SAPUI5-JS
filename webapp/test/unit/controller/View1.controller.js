/*global QUnit*/

sap.ui.define([
	"quizzapp/cdvproject/controller/View1.controller"
], function (Controller) {
	"use strict";

	function createFakeView() {
		var oModel = null;

		return {
			setModel: function (vModel, sName) {
				oModel = vModel;
			},
			getModel: function (sName) {
				if (sName === "i18n") {
					return {
						getResourceBundle: function () {
							return {
								getText: function (sKey) {
									return sKey;
								}
							};
						}
					};
				}

				return oModel;
			},
			byId: function () {
				return null;
			}
		};
	}

	QUnit.module("View1 Controller", {
		beforeEach: function () {
			this.oController = new Controller();
			this.oFakeView = createFakeView();
			this.oController.getView = function () {
				return this.oFakeView;
			}.bind(this);
			this.oController.byId = function () {
				return null;
			};
		}
	});

	QUnit.test("onInit creates the quiz model", function (assert) {
		this.oController.onInit();

		var oModel = this.oFakeView.getModel();
		assert.ok(oModel, "quiz model is created");
		assert.strictEqual(oModel.getProperty("/totalQuestions") > 0, true, "questions are available");
		assert.strictEqual(oModel.getProperty("/currentIndex"), 0, "starts at the first question");
	});

	QUnit.test("_normalizeQuestions accepts payloads with questions", function (assert) {
		var aQuestions = this.oController._normalizeQuestions({
			questions: [{
				question: "Test question",
				options: ["A", "B"],
				correctIndex: 1,
				explanation: "Because."
			}]
		});

		assert.strictEqual(aQuestions.length, 1, "one question is returned");
		assert.strictEqual(aQuestions[0].correctIndex, 1, "correct index is preserved");
	});

	QUnit.test("onAnswerPress advances score and progress", function (assert) {
		this.oController.onInit();

		var oModel = this.oFakeView.getModel();
		var oQuestion = {
			question: "Test question",
			options: ["A", "B"],
			correctIndex: 0,
			explanation: "Because."
		};

		oModel.setProperty("/currentQuestion", oQuestion);
		oModel.setProperty("/questions", [oQuestion]);
		oModel.setProperty("/totalQuestions", 1);
		oModel.setProperty("/currentIndex", 0);
		oModel.setProperty("/score", 0);
		oModel.setProperty("/review", []);

		this.oController.onAnswerPress({
			getSource: function () {
				return {
					getBindingContext: function () {
						return {
							getPath: function () {
								return "/currentQuestion/options/0";
							}
						};
					}
				};
			}
		});

		assert.strictEqual(oModel.getProperty("/score"), 1, "score increases when answer is correct");
		assert.strictEqual(oModel.getProperty("/quizCompleted"), true, "quiz completes after the last question");
	});

});
