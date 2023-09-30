'use strict';

class Question {
    /* Constructor */
    constructor() {
        this.#id = getRandomGUID();
    }

    /* Getters */
    get type() { return this.#type; }

    get id() { return this.#id; }

    get supportsOptions() { return this.type == QuestionType.MultipleChoice || this.type == QuestionType.CheckAll; }

    /* Setters */
    set type(type) {
        if (!(type instanceof QuestionType))
            throw new Error('Type must be a QuestionType');
        this.#type = type;
    }

    /* Methods */

    // Generates and returns a DOM structure to represent this question.
    createHTML() {
        if (this.#li) return this.#li;

        this.#li = document.createElement('li');
        this.#li.id = `question-${this.id}`;
        let div = document.createElement('div');
        this.#li.appendChild(div);

        // Prompt input
        let promptInput = document.createElement('input');
        promptInput.name = 'prompt';
        promptInput.placeholder = 'Who sailed to the Americas in 1492?';
        promptInput.addEventListener('input', e => this.prompt = e.target.value);
        promptInput.value = this.prompt;
        div.appendChild(promptInput);

        // Type select
        let typeSelect = document.createElement('select');
        typeSelect.name = 'type';
        Object.keys(QuestionType).forEach(k => {
            let option = document.createElement('option');
            option.value = k;
            option.textContent = QuestionType[k].display;
            typeSelect.appendChild(option);
        });
        typeSelect.value = this.type.value;
        typeSelect.addEventListener('change', () => this.type = QuestionType[typeSelect.value]);
        div.appendChild(typeSelect);

        // Delete button
        let deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.textContent = '✖';
        deleteButton.title = 'Remove question';
        deleteButton.addEventListener('click', () => QuizGenerator.instance.removeQuestion(this));
        div.appendChild(deleteButton);

        // Question-specific HTML
        this.#configureAnswerOptions(div, typeSelect);

        return this.#li;
    }

    // Configures the HTML to support the Multiple Choice and CheckAll question types.
    #configureAnswerOptions(parent, typeSelect) {
        let container = document.createElement('div');
        container.classList.add('answer-options');

        // Add option button
        let addAnswerButton = document.createElement('button');
        addAnswerButton.textContent = 'Add Option';
        addAnswerButton.addEventListener('click', () => this.addAnswerOption());
        container.appendChild(addAnswerButton);

        // Options list
        this.#optionsList = document.createElement('ul');
        this.#optionsList.className = 'answers';
        container.appendChild(this.#optionsList);

        // Assign event handler on question type to show/hide options.
        typeSelect.addEventListener('change', () => container.hidden = !this.supportsOptions);
        container.hidden = !this.supportsOptions;

        // Finished building, append container.
        parent.appendChild(container);
    }

    // Adds an answer option to the question.
    addAnswerOption(answerOption) {
        if (!this.supportsOptions) return;

        // Create answer option and add to internal array.
        if(!answerOption) answerOption = new AnswerOption(this);
        this.answerOptions.push(answerOption);

        // Building is complete, append div.
        this.#optionsList.appendChild(answerOption.createHTML());
    }

    // Removes an answer option
    // Arguments:
    //      answer: Instance of an AnswerOption to remove.
    removeAnswerOption(answer) {
        if (!(answer instanceof AnswerOption))
            throw new Error("Argument must be an instance of AnswerOption.");

        this.answerOptions = this.answerOptions.filter(a => a != answer);
        let li = this.#optionsList.querySelector(`#option-${answer.id}`);
        if (li) {
            this.#optionsList.removeChild(li);
        }
    }

    // Returns a JSON-ready version of this object.
    toSimple() {
        let o = {
            type: this.type.value,
            prompt: this.prompt,
        };

        if (this.supportsOptions) {
            o.answerOptions = this.answerOptions.map(a => a.toSimple());
        }

        return o;
    }

    // Creates a new question from the provided simple object.
    static fromSimple(simple) {
        let question = new Question();

        // Assign properties.
        question.type = QuestionType[simple.type];
        question.prompt = simple.prompt;

        // Generate HTML.
        question.createHTML();

        // Generate answer options.
        if (question.supportsOptions && simple.answerOptions) {
            simple.answerOptions.forEach(optionSimple => {
                let option = AnswerOption.fromSimple(optionSimple, question);
                question.addAnswerOption(option);
            });
        }

        return question;
    }

    toString() { return this.prompt; }

    /* Fields */
    #type = QuestionType.MultipleChoice;
    #optionsList;
    #id = '';
    #li;
    prompt = "";
    answerOptions = [];
}

class AnswerOption {
    /* Construtor */
    constructor(question) {
        if (!(question instanceof Question))
            throw new Error("Argument must be an instance of a Question.");
        this.question = question;
        this.#id = getRandomGUID();
    }

    /* Getters */
    get id() { return this.#id; }

    /* Methods */
    toString() { return this.display; }

    // Generates and returns a DOM structure to represent this answer option.
    createHTML() {
        if (this.#li) return this.#li;

        this.#li = document.createElement('li');
        this.#li.id = `option-${this.id}`;
        let container = document.createElement('div');
        this.#li.appendChild(container);

        // Value
        let valueInput = document.createElement('input');
        valueInput.placeholder = 'Value (A)';
        valueInput.classList.add('option-value');
        valueInput.value = this.value;
        valueInput.addEventListener('input', e => this.value = valueInput.value);
        container.appendChild(valueInput);

        // Display
        let displayInput = document.createElement('input');
        displayInput.placeholder = 'Display (Christopher Columbus)';
        displayInput.classList.add('option-display');
        displayInput.value = this.display;
        displayInput.addEventListener('input', e => this.display = displayInput.value);
        container.appendChild(displayInput);

        // Delete button
        let deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.textContent = '✖';
        deleteButton.title = 'Remove option';
        deleteButton.addEventListener('click', () => this.question.removeAnswerOption(this));
        container.appendChild(deleteButton);

        return this.#li;
    }

    // Returns a JSON-ready version of this object.
    toSimple() {
        return {
            value: this.value,
            display: this.display
        };
    }

    // Creates a new question from the provided simple object.
    static fromSimple(simple, question) {
        let option = new AnswerOption(question);

        // Assign properties.
        option.display = simple.display;
        option.value = simple.value;

        // Generate HTML.
        option.createHTML();

        return option;
    }

    /* Fields */
    value = '';
    display = '';
    #id;
    #li;
}

class QuizGenerator {
    /* Constructor */
    constructor(questionList, addQuestionButton) {
        if (QuizGenerator.#instance !== undefined)
            throw new Error('Cannot have multiple instances of the QuizGenerator.');

        if (!(questionList instanceof HTMLOListElement))
            throw new Error('questionList must be a OL element.');

        if (!(addQuestionButton instanceof HTMLButtonElement))
            throw new Error('addQuestionButton must be a Button element.');

        QuizGenerator.#instance = this;

        this.#questionList = questionList;
        addQuestionButton.addEventListener('click', () => this.addQuestion());
    }

    /* Getters */

    static get instance() { return this.#instance; }

    /* Methods */

    // Adds a question
    // Arguments:
    //      question: Existing question to append to the list.
    addQuestion(question) {
        if (!question) question = new Question();
        this.questions.push(question);

        this.#questionList.appendChild(question.createHTML());
    }

    // Removes an answer option
    // Arguments:
    //      answer: Instance of a Question to remove.
    removeQuestion(question) {
        if (!(question instanceof Question))
            throw new Error("Argument must be an instance of Question.");

        this.questions = this.questions.filter(a => a != question);
        let li = this.#questionList.querySelector(`#question-${question.id}`);
        if (li) {
            this.#questionList.removeChild(li);
        }
    }

    // Returns the quiz in a JSON-formatted string.
    toJSON() {
        let simpleObj = {
            questions: this.questions.map(q => q.toSimple())
        };
        return JSON.stringify(simpleObj);
    }

    // Loads a quiz from JSON.
    loadJSON(json) {
        var obj = JSON.parse(json);
        if (obj.questions) {
            obj.questions.forEach(q => {
                let question = Question.fromSimple(q);
                this.addQuestion(question);
            });
        }
    }

    /* Fields */
    static #instance;   // Singleton instance
    questions = [];
    #questionList;
}

function save() {
    localStorage.setItem(QUIZ_KEY, QuizGenerator.instance.toJSON());
}

const saveButton = document.querySelector('#save');
const takeQuizButton = document.querySelector('#takeQuiz');

saveButton.addEventListener('click', save);

takeQuizButton.addEventListener('click', () => {
    if (QuizGenerator.instance.questions.length > 0) {
        save();
        window.location.assign("take-quiz.html");
    }
    else {
        alert("Please create a question first.");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const questionList = document.querySelector('#questionsList');
    const addQuestionButton = document.querySelector('#addQuestion');
    const quiz = new QuizGenerator(questionList, addQuestionButton);

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