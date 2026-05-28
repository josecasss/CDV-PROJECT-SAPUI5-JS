sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    function createQuestion(sQuestion, aAnswers, sExplanation, iCorrectIndex) {
        return {
            question: sQuestion,
            options: aAnswers,
            correctIndex: typeof iCorrectIndex === "number" ? iCorrectIndex : 0,
            explanation: sExplanation
        };
    }

    function createQuizQuestions() {
        return [
            createQuestion(
                "Which SAP solution is the flagship ERP suite for large enterprises?",
                [
                    "SAP S/4HANA",
                    "SAP Business One",
                    "SAP Analytics Cloud",
                    "SAP Ariba",
                    "SAP SuccessFactors"
                ],
                "SAP S/4HANA is SAP's intelligent ERP suite for digital core operations."
            ),
            createQuestion(
                "What does ABAP stand for?",
                [
                    "Advanced Business Application Programming",
                    "Automated Business Apps Platform",
                    "Applied Business Analysis Protocol",
                    "Adaptive Backend Application Process",
                    "Application Base Access Program"
                ],
                "ABAP stands for Advanced Business Application Programming."
            ),
            createQuestion(
                "Which SAP platform is used to build, extend, and integrate enterprise applications?",
                [
                    "SAP Business Technology Platform",
                    "SAP Base Toolkit Platform",
                    "SAP Business Transaction Portal",
                    "SAP Backend Transfer Process",
                    "SAP Billing Transformation Platform"
                ],
                "SAP BTP is SAP's cloud platform for application development, integration, and analytics."
            ),
            createQuestion(
                "Which UI technology is SAP's standard framework for enterprise web applications?",
                [
                    "SAPUI5",
                    "Angular",
                    "React",
                    "Flutter",
                    "Vue.js"
                ],
                "SAPUI5 is SAP's enterprise-ready UI framework for responsive applications."
            ),
            createQuestion(
                "Which SAP product is mainly used for human experience and talent management?",
                [
                    "SAP SuccessFactors",
                    "SAP Concur",
                    "SAP Integrated Business Planning",
                    "SAP Extended Warehouse Management",
                    "SAP HANA Cloud"
                ],
                "SAP SuccessFactors focuses on human capital management and employee experience."
            )
        ];
    }

    function buildSampleQuizJson() {
        return JSON.stringify({
            questions: createQuizQuestions().slice(0, 1)
        }, null, 2);
    }

    function normalizeQuestion(oQuestion, iQuestionIndex) {
        const sQuestion = typeof oQuestion.question === "string" ? oQuestion.question.trim() : "";

        if (!sQuestion) {
            throw new Error("Question " + (iQuestionIndex + 1) + " is missing the question text.");
        }

        if (!Array.isArray(oQuestion.options) || oQuestion.options.length < 2) {
            throw new Error("Question " + (iQuestionIndex + 1) + " must include at least two answer options.");
        }

        const aOptions = oQuestion.options.map(function (sOption, iOptionIndex) {
            const sValue = typeof sOption === "string" ? sOption.trim() : "";

            if (!sValue) {
                throw new Error("Question " + (iQuestionIndex + 1) + " has an empty option at position " + (iOptionIndex + 1) + ".");
            }

            return sValue;
        });

        const iCorrectIndex = oQuestion.correctIndex === undefined || oQuestion.correctIndex === null || oQuestion.correctIndex === ""
            ? 0
            : Number(oQuestion.correctIndex);

        if (!Number.isInteger(iCorrectIndex) || iCorrectIndex < 0 || iCorrectIndex >= aOptions.length) {
            throw new Error("Question " + (iQuestionIndex + 1) + " has an invalid correctIndex value.");
        }

        const sExplanation = typeof oQuestion.explanation === "string" ? oQuestion.explanation.trim() : "";

        return createQuestion(sQuestion, aOptions, sExplanation, iCorrectIndex);
    }

    function extractQuestionList(vPayload) {
        if (Array.isArray(vPayload)) {
            return vPayload;
        }

        if (vPayload && Array.isArray(vPayload.questions)) {
            return vPayload.questions;
        }

        throw new Error("Expected a JSON array of questions or an object with a questions array.");
    }

    return Controller.extend("quizzapp.cdvproject.controller.View1", {
        onInit: function () {
            this._setInitialState(createQuizQuestions());
        },

        onAnswerPress: function (oEvent) {
            const oModel = this.getView().getModel("quiz");
            const oData = oModel.getData();
            const iQuestionIndex = oData.currentIndex;
            const oQuestion = oData.questions[iQuestionIndex];
            const iAnswerIndex = Number(oEvent.getSource().data("answerIndex"));
            const sSelectedAnswer = oQuestion.options[iAnswerIndex];
            const sCorrectAnswer = oQuestion.options[oQuestion.correctIndex];
            const bCorrect = iAnswerIndex === oQuestion.correctIndex;
            const iScore = oData.score + (bCorrect ? 1 : 0);
            const aReview = oData.review.concat({
                questionNumber: iQuestionIndex + 1,
                question: oQuestion.question,
                selectedAnswer: sSelectedAnswer,
                correctAnswer: sCorrectAnswer,
                isCorrect: bCorrect,
                explanation: oQuestion.explanation
            });
            const iNextIndex = iQuestionIndex + 1;
            const bCompleted = iNextIndex >= oData.totalQuestions;
            const oNextQuestion = bCompleted ? oQuestion : oData.questions[iNextIndex];

            MessageToast.show(bCorrect ? "Correct!" : "Not quite. Review the final summary for the right answer.");

            oModel.setData({
                questions: oData.questions,
                totalQuestions: oData.totalQuestions,
                currentIndex: iNextIndex,
                currentQuestion: oNextQuestion,
                progressValue: bCompleted ? 100 : Math.round((iNextIndex / oData.totalQuestions) * 100),
                progressText: bCompleted ? "Completed" : "Question " + (iNextIndex + 1) + " of " + oData.totalQuestions,
                score: iScore,
                quizCompleted: bCompleted,
                review: aReview,
                resultMessage: "You scored " + iScore + " out of " + oData.totalQuestions + "."
            });
        },

        onRestartQuiz: function () {
            this._setInitialState(this._aActiveQuestions || createQuizQuestions());
        },

        onUseDemoQuiz: function () {
            const oJsonInput = this.byId("quizJsonInput");

            if (oJsonInput) {
                oJsonInput.setValue(buildSampleQuizJson());
            }

            this._setInputFeedback("A demo JSON sample was loaded into the editor.", "Information");
        },

        onClearQuizInputs: function () {
            const oJsonInput = this.byId("quizJsonInput");
            const oUrlInput = this.byId("quizApiUrlInput");

            if (oJsonInput) {
                oJsonInput.setValue("");
            }

            if (oUrlInput) {
                oUrlInput.setValue("");
            }

            this._setInputFeedback("Inputs cleared. Paste JSON or use a quiz API URL to load questions.", "Information");
        },

        onLoadQuizFromJson: function () {
            const oTextArea = this.byId("quizJsonInput");
            const sJson = oTextArea ? oTextArea.getValue().trim() : "";

            if (!sJson) {
                this._setInputFeedback("Paste quiz questions in JSON format first.", "Warning");
                MessageBox.warning("Paste quiz questions in JSON format first.");
                return;
            }

            try {
                this._setInputLoading(true, "Parsing JSON...");
                const vPayload = JSON.parse(sJson);
                const aQuestions = this._normalizeQuestions(vPayload);

                this._setInitialState(aQuestions);
                this._setInputLoading(false, "Quiz loaded from JSON.", "Success");
                MessageToast.show("Quiz loaded from JSON.");
            } catch (oError) {
                this._setInputLoading(false);
                this._setInputFeedback(oError.message || "The pasted JSON could not be loaded.", "Error");
                MessageBox.error(oError.message || "The pasted JSON could not be loaded.");
            }
        },

        onLoadQuizFromUrl: async function () {
            const oInput = this.byId("quizApiUrlInput");
            const sUrl = oInput ? oInput.getValue().trim() : "";

            if (!sUrl) {
                this._setInputFeedback("Enter a quiz API URL first.", "Warning");
                MessageBox.warning("Enter a quiz API URL first.");
                return;
            }

            try {
                this._setInputLoading(true, "Fetching questions from the API...");
                const oResponse = await fetch(sUrl, {
                    headers: {
                        Accept: "application/json"
                    }
                });

                if (!oResponse.ok) {
                    throw new Error("The API request failed with status " + oResponse.status + " " + oResponse.statusText + ".");
                }

                const vPayload = await oResponse.json();
                const aQuestions = this._normalizeQuestions(vPayload);

                this._setInitialState(aQuestions);
                this._setInputLoading(false, "Quiz loaded from the API.", "Success");
                MessageToast.show("Quiz loaded from the API.");
            } catch (oError) {
                this._setInputLoading(false);
                this._setInputFeedback(oError.message || "The quiz could not be loaded from the API.", "Error");
                MessageBox.error(oError.message || "The quiz could not be loaded from the API.");
            }
        },

        _setInitialState: function (aQuestions) {
            const aInitialQuestions = Array.isArray(aQuestions) && aQuestions.length ? aQuestions : createQuizQuestions();

            this._aActiveQuestions = aInitialQuestions;

            const oQuizModel = new JSONModel({
                questions: aInitialQuestions,
                totalQuestions: aInitialQuestions.length,
                currentIndex: 0,
                currentQuestion: aInitialQuestions[0],
                progressValue: Math.round((1 / aInitialQuestions.length) * 100),
                progressText: "Question 1 of " + aInitialQuestions.length,
                progressCount: 1,
                score: 0,
                quizCompleted: false,
                review: [],
                resultMessage: "",
                loading: false,
                loadingMessage: "",
                inputFeedbackMessage: "Ready to load sample JSON or paste your own quiz data.",
                inputFeedbackType: "Information"
            });

            this.getView().setModel(oQuizModel, "quiz");
        },

        _setInputLoading: function (bLoading, sMessage, sType) {
            const oModel = this.getView().getModel("quiz");

            if (!oModel) {
                return;
            }

            oModel.setProperty("/loading", !!bLoading);

            if (sMessage !== undefined) {
                oModel.setProperty("/loadingMessage", sMessage || "");
            }

            if (sMessage && sType) {
                oModel.setProperty("/inputFeedbackMessage", sMessage);
                oModel.setProperty("/inputFeedbackType", sType);
            }
        },

        _setInputFeedback: function (sMessage, sType) {
            const oModel = this.getView().getModel("quiz");

            if (!oModel) {
                return;
            }

            oModel.setProperty("/inputFeedbackMessage", sMessage);
            oModel.setProperty("/inputFeedbackType", sType || "Information");
        },

        _normalizeQuestions: function (vPayload) {
            const aRawQuestions = extractQuestionList(vPayload);

            if (!aRawQuestions.length) {
                throw new Error("The quiz data does not contain any questions.");
            }

            return aRawQuestions.map(normalizeQuestion);
        }
    });
});