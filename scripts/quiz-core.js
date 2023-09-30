class QuestionType {
    /* Constructor */
    constructor(value, display) {
        this.#value = value;
        this.#display = display || value;
    }

    /* Getters */
    get value() { return this.#value; }
    get display() { return this.#display; }

    /* Methods */
    toString() {
        return this.#value;
    }

    /* Fields */
    static MultipleChoice = new QuestionType('MultipleChoice', 'Multiple Choice');
    static CheckAll = new QuestionType('CheckAll', 'Check All');
    static Input = new QuestionType('Input');
    static Essay = new QuestionType('Essay');

    #value = '';
    #display = '';
}

function getRandomGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}

const QUIZ_KEY = 'quiz';