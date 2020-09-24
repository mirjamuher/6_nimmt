"""
Step 0: Setting it up
"""
import random
from typing import List, Dict


BASE_DECK = {
    2: [5, 15, 25, 35, 45, 65, 75, 85, 95],
    3: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    5: [11, 22, 33, 44, 66, 77, 88, 99],
    7: [55],
}


class Card:
    """
    Card Object, storing value and number of Hornochsen
    """
    def __init__(self, value, ochsen):
        self._value = value
        self._ochsen = ochsen

    def __repr__(self):  # pragma: nocover
        return f"[Card {self._value}]"

    def __hash__(self):
        return hash(self._value)

    def __lt__(self, other):
        return self._value < other._value

    def __eq__(self, other):
        return self._value == other._value

    def ochsen(self):
        return self._ochsen


class Player:
    """
    Player class keeps track of id, name, hand, points
    """
    def __init__(self, player_name, player_id, no):
        self._name = player_name
        self._id = player_id
        self._no = no
        self._points = 0
        self._hand = []
        self._selected_card = None

    def name(self) -> str:
        return self._name

    def id(self) -> int:
        return self._id

    def no(self) -> int:
        return self._no

    def points(self) -> int:
        return self._points

    def hand(self) -> List[Card]:
        return self._hand

    def deal_hand(self, hand: List[Card]) -> None:
        self._hand = hand

    def select_card(self, card: Card) -> None:
        self._hand.remove(card)
        self._selected_card = card

    def is_card_selected(self):
        if self._selected_card is None:
            return False
        else:
            return True


class Game:
    """
    Game Object. Made per game started.
    Keeps track of no of players, their hands, and the four stacks on the table
    # 1: Initialise Game - Game()
    # 2: Add players until all players are present - add_player(name)
    # 3: Start game - game_start()
    # 4: Each player choses what card to play - select_card(player_id, card); triggers enter_round
    """
    def __init__(self):
        self._player_list = []  # [ Player, ...]
        self._players = {}  # {player id : Player, ...}

        self._stacks = ([], [], [], [])  # [ Card ]
        self._state = "waiting"

    def get_state(self) -> str:
        return self._state

    def get_nplayers(self) -> int:
        return len(self._player_list)

    def get_player_hands(self) -> Dict[int, List[Card]]:
        return {player.id(): player.hand() for player in self._player_list}

    def get_stacks(self) -> List[Card]:
        return self._stacks

    def get_player_list(self):
        return self._player_list

    def add_player(self, player_name: str) -> Player:
        # Need to make each player, including p1 enter their name and thus call this API
        new_id = self.create_player_id()
        new_player = Player(player_name, new_id, len(self._players) + 1)
        self._player_list.append(new_player)
        self._players[new_id] = new_player
        return new_player

    def create_player_id(self) -> int:
        while True:
            new_id = random.randint(100000, 999999)
            if new_id not in self._players:
                return new_id

    def game_start(self) -> None:
        """
        Activated when p1 presses the "play" button, indicating that all participants have logged in.
        Creates & shuffles deck and deals cards to all players as well as to stacks
        """
        self._state = "dealing"
        deck = self.create_deck()
        self.deal_cards(deck)

    def create_deck(self) -> List[Card]:
        """
        Creates DECK full of Card-Objects
        Creates Set of 1-104 and thus assigns Card objects with just one Ochse
        """
        all_numbers = set([x for x in range(1, 105)])
        crnt_set = set()
        deck = []

        for ochsen, number_list in BASE_DECK.items():
            for number in number_list:
                deck.append(Card(number, ochsen))
                crnt_set.add(number)

        for i in (all_numbers - crnt_set):
            deck.append(Card(i, 1))

        random.shuffle(deck)
        return(deck)

    def deal_cards(self, deck: List[Card]) -> None:
        """
        Deals each player 10 cards and adds one card to each stack
        """
        for player in self._player_list:
            player.deal_hand([deck.pop() for _ in range(10)])

        for stack in self._stacks:
            stack.append(deck.pop())

    def get_hand(self, player_id: int) -> List[Card]:
        """
        TODO: Once Cards have been dealt, each client will ask for their cards
        """
        if player_id not in self._players:
            raise ValueError("This player does not exist")
        player = self._players[player_id]
        return player.hand()

    def select_card(self, player_id: int, card: Card):
        if player_id not in self._players:
            raise ValueError("This player does not exist")

        player = self._players[player_id]

        if player.is_card_selected():
            raise ValueError("This player has already played. Your choice is final.")

        self._state = "Selecting Cards"
        player.select_card(card)

        if all([p.is_card_selected() for p in self._player_list]):
            self._state = "All Cards Selected"
            self.enter_round()

    def enter_round(self):
        """
        TODO sort selected cards and play them onto stacks and award points and all that jazz
        """
        self._state = "Round in Progress"
