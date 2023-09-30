"use strict";

const submitForm = document.querySelector('form');

class Question {
    /* Constructor */
    constructor(obj) {
        if (!obj)
            throw new Error("Argument must have a value.");

        if (!obj.prompt || !obj.type)
            throw new Error("Argument must be a Question object.");

        this.#id = getRandomGUID();

        this.prompt = obj.prompt;
        this.type = obj.type;

        let hasOptions = this.type == QuestionType.MultipleChoice.value || this.type == QuestionType.CheckAll.value;
        if (hasOptions)
            this.answerOptions = obj.answerOptions || [];
    }

    /* Getters */

    get answer() {
        if (!this.#answerElement) return undefined;

        let answer = '';

        switch (this.type) {
            case QuestionType.MultipleChoice.value:
                answer = this.#answerElement.querySelector(':checked')?.value;
                break;
            case QuestionType.CheckAll.value:
                let selected = this.#answerElement.querySelectorAll(':checked');
                let answers = [];
                selected.forEach(s => answers.push(s.value));
                answer = answers.toString();
                break;
            case QuestionType.Input.value:
                answer = this.#answerElement.value;
                break;
            case QuestionType.Essay.value:
                answer = this.#answerElement.value;
                break;
            default:
        }

        return answer || '';
    }

    /* Methods */

    // Generates and returns a DOM structure to represent this answer option.
    createHTML() {
        let li = document.createElement('li');
        li.id = `question-${this.#id}`;

        // Prompt
        let prompt = document.createElement('h3');
        prompt.textContent = this.prompt;
        li.appendChild(prompt);

        // Answer
        switch (this.type) {
            case QuestionType.MultipleChoice.value:
                this.#answerElement = document.createElement('ul');

                this.answerOptions.forEach(option => {
                    let optionLi = document.createElement('li');
                    let rb = document.createElement('input');
                    rb.type = 'radio';
                    rb.value = option.value;
                    rb.id = `option-${this.#id}-${option.value}`;
                    rb.name = `option-${this.#id}`;
                    optionLi.appendChild(rb);

                    let label = document.createElement('label');
                    label.setAttribute('for', rb.id);
                    label.textContent = option.display;
                    optionLi.appendChild(label);

                    this.#answerElement.appendChild(optionLi);
                });

                break;
            case QuestionType.CheckAll.value:
                this.#answerElement = document.createElement('ul');

                this.answerOptions.forEach(option => {
                    let optionLi = document.createElement('li');
                    let rb = document.createElement('input');
                    rb.type = 'checkbox';
                    rb.value = option.value;
                    rb.id = `option-${this.#id}-${option.value}`;
                    optionLi.appendChild(rb);

                    let label = document.createElement('label');
                    label.setAttribute('for', rb.id);
                    label.textContent = option.display;
                    optionLi.appendChild(label);

                    this.#answerElement.appendChild(optionLi);
                });

                break;
            case QuestionType.Input.value:
                this.#answerElement = document.createElement('input');
                this.#answerElement.placeholder = 'Enter your response here...';
                break;
            case QuestionType.Essay.value:
                this.#answerElement = document.createElement('textarea');
                this.#answerElement.rows = 7;
                this.#answerElement.placeholder = 'Enter your response here...';
                break;
            default:
        }

        if (!this.#answerElement)
            throw new Error("Question has been misconfigured");

        li.appendChild(this.#answerElement);

        return li;
    }

    #answerElement;
    #id = '';
}

class QuizGenerator {
    /* Constructor */
    constructor(questionList) {
        if (QuizGenerator.#instance != undefined)
            throw new Error("Cannot have multipled instances of a QuizGenerator.");

        if (!(questionList instanceof HTMLOListElement))
            throw new Error("Argument must be an instance of an OL element.");

        QuizGenerator.#instance = this;
        this.#questionList = questionList;
    }

    /* Getters */

    get answers() {
        let answers = {};
        this.#questions.forEach(q => {
            answers[q.prompt] = q.answer;
        });
        return JSON.stringify(answers);
    }

    static get instance() { return this.#instance; }

    /* Methods */

    // Adds a question
    // Parameters:
    //      question: The question to add.
    addQuestion(question) {
        if (!(question instanceof Question))
            throw new Error("Argument must be an instance of Question.");

        this.#questions.push(question);
        this.#questionList.appendChild(question.createHTML());
    }

    // Loads a quiz from JSON.
    loadJSON(json) {
        var obj = JSON.parse(json);
        if (obj.questions) {
            obj.questions.forEach(q => {
                let question = new Question(q);
                this.addQuestion(question);
            });
        }
    }

    #questions = [];
    #questionList;
    static #instance;
}

document.addEventListener('DOMContentLoaded', () => {
    const questionList = document.querySelector('#questionsList');
    const quiz = new QuizGenerator(questionList);

    // Load existing quiz from storage.
    const json = localStorage.getItem(QUIZ_KEY);
    if (json) {
            try {
                quiz.loadJSON(json);
            }
            catch {
                alert("Unable to load quiz from local storage.");
            }
    }
});

submitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let answers = QuizGenerator.instance.answers;
    let a = submitForm.querySelector('a');
    a.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(answers)}`);
    a.click();
});