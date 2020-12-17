import { html } from './vendor/lit-html.js';
import { LitElement, css } from './vendor/lit-element.js';

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

// Creating the MyCard Element
class MyCard extends LitElement {
    static get properties() {
        return {
            cardValue: {type: Number}, //Fed in through html jinja2 --> affects styling
            location: {type: String}, //'hand' or 'table'
        }
    }

    constructor() {
        super();
        this.cardValue = -1;
        this.location = 'table';
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
            border-radius: 10px;
            box-shadow: 0 4px 8px 0 rgba(0,0,0,0.3);
            text-align: center;
            display: flex;
            justify-content: center;
        }

        .card:hover {
            box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
        }

        .hand {
            width: 120px;
            height: 180px;
            margin: 15px 5px;
        }

        .table {
            width: 80px;
            height: 120px;
            margin: 5px;
        }

        .pointValue {
            place-self: center;
            font-size: 45px;
            font-family: 'Rubik', sans-serif;
            font-weight: bold;

            /*
            font-family: 'Noto Sans SC', sans-serif;
            font-family: 'Roboto', sans-serif;
            font-family: 'Rubik', sans-serif;
            */
        }

        .hornochsen {
            display: none;
        }

        ._1 {
            /*GREY*/
            background-image: url('/static/images/cards/1.png');
            background-size: cover;
            /*color: #625478; pretty dark purple*/
            color: #ede7f6;
            -webkit-text-stroke-width: 0.8px;
            -webkit-text-stroke-color: #512da8;
        }
        ._2 {
            /*BLUE*/
            background-image: url('/static/images/cards/2.png');
            background-size: cover;
            color: #fff176;
            -webkit-text-stroke-width: 0.5px;
            -webkit-text-stroke-color: #3e2723;
        }
        ._3 {
            /*YELLOW*/
            background-image: url('/static/images/cards/3.png');
            background-size: cover;
            /*color: #2196f3; DARK BLUE */
            color: #bbdefb;
            -webkit-text-stroke-width: 0.8px;
            -webkit-text-stroke-color: #1a237e;
        }
        ._5 {
            /*ORANGE*/
            background-image: url('/static/images/cards/5.png');
            background-size: cover;
            /*color: #ffb74d; GOOD ORANGE */
            color: #f8bbd0;
            -webkit-text-stroke-width: 0.8px;
            -webkit-text-stroke-color: #bf360c;
        }
        ._7 {
            /*RED*/
            background-image: url('/static/images/cards/7.png');
            background-size: cover;
            color: #ffcdd2;
            -webkit-text-stroke-width: 0.5px;
            -webkit-text-stroke-color: #b71c1c;
        }

        ._-1 {
            background-image: none;
            border: 1px solid transparent;
        }

        ._-1:hover {
            box-shadow: 0 4px 8px 0 rgba(0,0,0,0.3);
        }
    `}

    render() {
        return html`
        <div class="card _${this.ochsen()} ${this.location}">
            <span class="pointValue" id="_${this.cardValue}">${this.cardValue === -1 ? '' : this.cardValue}</span>
        </div>
        `;
  }
}
customElements.define('my-card', MyCard);
