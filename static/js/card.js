import { html } from './vendor/lit-html.js';
import { LitElement, css } from './vendor/lit-element.js';

// Setting Colors
const primaryBgColor = css `white`;
const secondaryBgColor = css `#a8dadc`;
const tertiaryBgColor = css `#457b9d`;
const headerBgcolor = css `#1d3557`;
const btnColor = css `#e63946`;
const primaryTxtColor = css `#457b9d`;
const secondaryTxtColor = css `#f1faee`;
const tertiaryTxtColor = css `#1d3557`;
const emphasisTxtColor = css `#e63946`;
const borderColor = css `#1d3557`;

// Set up baseDeck with ochsen - cardValue pairs
const baseDeck = new Map([
    [2, [5, 15, 25, 35, 45, 65, 75, 85, 95]],
    [3, [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]],
    [5, [11, 22, 33, 44, 66, 77, 88, 99]],
    [7, [55]],
])

// Set up invertedBaseDeck with cardValue - ochsen pairs
let invertedBaseDeck = new Map()
invertedBaseDeck.set(-1, -1); // Sets a -1 value for the initialising of the webcomponent constructor
for (let n=1; n<105; n++) {
    invertedBaseDeck.set(n, 1); // Sets up dict with numbers 1-104 associate with ochsen 1
}
for (let [ochsen, valueList] of baseDeck.entries()) {
    for (let value of valueList) {
        invertedBaseDeck.set(value, ochsen);
    }
}

class MyCard extends LitElement {
    static get properties() {
        return {
            cardValue: {type: Number}, //Fed in through html jinja2 --> affects styling
        }
    }

    constructor() {
        super();
        this.cardValue = -1;
    }

    ochsen() {
        return invertedBaseDeck.get(this.cardValue);
    }

    static get styles() {
        return css`
        :host {
            display: inline-block;
        }
        .card {
            border: 2px solid black;
            background-color: white;
            margin: 15px 5px;
            width: 100px;
            height: 150px;
            border-radius: 10px;
            box-shadow: 0 4px 8px 0 rgba(0,0,0,0.3);
            text-align: center;
        }
        ._1 {
            background-color: green;
        }
        ._2 {
            background-color: blue;
        }
        ._3 {
            background-color: yellow;
        }
        ._5 {
            background-color: purple;
        }
        ._7 {
            background-color: red;
        }
    `}

    render() {
        return html`
        <div class="card _${this.ochsen()}">
            <span class="hornochsen">${this.ochsen()}</span>
            <span class="pointValue" id="_${this.cardValue}">${this.cardValue}</span>
        </div>
        `;
  }
}
customElements.define('my-card', MyCard);
