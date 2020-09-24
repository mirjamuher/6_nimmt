import unittest
from unittest.mock import patch

from game import Card, Game, Player


class TestCard(unittest.TestCase):
    def test_equal(self):
        c1 = Card(4, 1)
        c2 = Card(4, 1)
        self.assertEqual(c1, c2)

        c1 = Card(100, 6)
        c2 = Card(100, 6)
        self.assertEqual(c1, c2)

        c1 = Card(104, 1)
        c2 = Card(100, 6)
        self.assertNotEqual(c1, c2)

    def test_less_than(self):
        c1 = Card(5, 3)
        c2 = Card(20, 1)
        self.assertLess(c1, c2)

    def test_ochsen(self):
        c = Card(4, 1)
        self.assertEqual(1, c.ochsen())

        c = Card(6, 3)
        self.assertEqual(3, c.ochsen())


class TestPlayer(unittest.TestCase):
    def test_attributes(self):
        p1 = Player('Miri', 110155, 2)
        self.assertEqual(p1.name(), 'Miri')
        self.assertEqual(p1.id(), 110155)
        self.assertEqual(p1.no(), 2)
        self.assertEqual(p1.points(), 0)
        self.assertEqual(p1.hand(), [])
        self.assertFalse(p1.is_card_selected())

    def test_hand(self):
        p1 = Player('Miri', 110155, 2)
        p1.deal_hand([Card(1, 1), Card(10,5), Card(100, 3)])
        self.assertTrue(p1.hand(), [Card(1, 1), Card(10,5), Card(100, 3)])
        p1.select_card(Card(10,5))
        self.assertTrue(p1.hand(), [Card(1, 1), Card(100, 3)])
        self.assertTrue(p1.is_card_selected())


class TestGame(unittest.TestCase):
    def test_game_setup_state(self):
        g1 = Game()
        self.assertEqual(0, g1.get_nplayers())
        self.assertEqual("waiting", g1.get_state())

    def test_add_player(self):
        """
        Test a basic setup with two players, different names
        """
        g1 = Game()
        player_set = set()
        tim_id = g1.add_player("Tim")
        player_set.add(tim_id)
        self.assertEqual(1, g1.get_nplayers())
        miri_id = g1.add_player("Miri")
        player_set.add(miri_id)
        self.assertEqual(2, g1.get_nplayers())
        self.assertEqual(len(player_set), g1.get_nplayers())

    def test_add_player_complex(self):
        """
        Test a complicated setup with two players, same names
        """
        g1 = Game()
        player_set = set()
        p1_id = g1.add_player("Elijah")
        player_set.add(p1_id)
        p2_id = g1.add_player("Elijah")
        player_set.add(p2_id)
        self.assertEqual(2, g1.get_nplayers())
        self.assertEqual(len(player_set), g1.get_nplayers())

    def _setup_game(self, player_names = ["Tim", "Elijah", "Miri"]):
        """
        XXX: Sets up a mock game for testing 
        """
        g1 = Game()
        for name in player_names:
            g1.add_player(name)
        return g1

    def test_game_start(self):
        g1 = self._setup_game()
        g1.game_start()
        self.assertEqual("dealing", g1.get_state())

    def test_create_deck(self):
        g1 = self._setup_game()
        deck = g1.create_deck()
        set_deck = set(deck)
        self.assertEqual(104, len(set_deck))

    def _setup_and_deal_cards(self):
        """
        XXX: Sets up mock game & deals cards for testing
        """
        g1 = self._setup_game()
        deck = g1.create_deck()
        g1.deal_cards(deck)    
        return g1  

    def test_deal_cards(self):
        g1 = self._setup_and_deal_cards()
        all_set = set()
        no_of_cards = 0
        for player, hand in g1.get_player_hands().items():
            check_hand = set(hand)
            self.assertEqual(10, len(hand))
            self.assertEqual(10, len(check_hand))
            all_set.update(check_hand)
            no_of_cards += len(hand)

        for stack in g1.get_stacks():
            self.assertEqual(1, len(stack))
            all_set.update(stack)
            no_of_cards += len(stack)

        self.assertEqual(no_of_cards, len(all_set))

    def test_get_hand(self):
        # sets up game and gets out all variables we need
        g1 = self._setup_and_deal_cards()
        p1 = g1.get_player_list()[0]
        p1_id = p1.id()
        self.assertEqual(g1.get_hand(p1_id), p1.hand())

    def test_faulty_get_hand(self):
        """
        Tests getting the hand of a palyer that is not registered in the game
        """
        g1 = self._setup_and_deal_cards()
        p1_id = 404
        with self.assertRaisesRegex(ValueError, "This player does not exist"):
            g1.get_hand(p1_id)

    def test_select_card(self):
        with patch.object(Game, 'enter_round') as mocked_enter_round:
            # sets up game and gets out all variables we need
            g1 = self._setup_and_deal_cards()
            p1 = g1.get_player_list()[0]
            p1_id = p1.id()
            p1_card = p1.hand()[0]
            p2 = g1.get_player_list()[1]
            p2_id = p2.id()
            p2_card = p2.hand()[0]
            p3 = g1.get_player_list()[2]
            p3_id = p3.id()
            p3_card = p3.hand()[0]

            g1.select_card(p1_id, p1_card)
            mocked_enter_round.assert_not_called()
            self.assertEqual(g1.get_state(), "Selecting Cards")

            # If everyone has selected a card, we should enter gamestate "All Cards Selected"
            g1.select_card(p2_id, p2_card)
            mocked_enter_round.assert_not_called()
            g1.select_card(p3_id, p3_card)
            mocked_enter_round.assert_called_once_with()
            self.assertEqual(g1.get_state(), "All Cards Selected")

    def test_faulty_select_card(self):
        """
        Tests ValueErrors with a faulty setup
        """
        g1 = self._setup_and_deal_cards()
        p0_id = 404
        p0_card = Card(404, 4)
        with self.assertRaisesRegex(ValueError, "This player does not exist"):
            g1.select_card(p0_id, p0_card)

        p1 = g1.get_player_list()[0]
        p1_id = p1.id()
        p1_card = p1.hand()[0]
        g1.select_card(p1_id, p1_card)
        with self.assertRaisesRegex(ValueError, "This player has already played. Your choice is final."):
            g1.select_card(p1_id, Card(404, 4))

