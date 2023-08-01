import { useState } from "react";
import {
  Card,
  CardRank,
  CardDeck,
  CardSuit,
  GameState,
  Hand,
  GameResult,
} from "./types";

//UI Elements
const CardBackImage = () => (
  <img src={process.env.PUBLIC_URL + `/SVG-cards/png/1x/back.png`} />
);

const CardImage = ({ suit, rank }: Card) => {
  const card = rank === CardRank.Ace ? 1 : rank;
  return (
    <img
      src={
        process.env.PUBLIC_URL +
        `/SVG-cards/png/1x/${suit.slice(0, -1)}_${card}.png`
      }
    />
  );
};

//Setup
const newCardDeck = (): CardDeck =>
  Object.values(CardSuit)
    .map((suit) =>
      Object.values(CardRank).map((rank) => ({
        suit,
        rank,
      }))
    )
    .reduce((a, v) => [...a, ...v]);

const shuffle = (deck: CardDeck): CardDeck => {
  return deck.sort(() => Math.random() - 0.5);
};

const takeCard = (deck: CardDeck): { card: Card; remaining: CardDeck } => {
  const card = deck[deck.length - 1];
  const remaining = deck.slice(0, deck.length - 1);
  return { card, remaining };
};

const setupGame = (): GameState => {
  const cardDeck = shuffle(newCardDeck());
  return {
    playerHand: cardDeck.slice(cardDeck.length - 2, cardDeck.length),
    dealerHand: cardDeck.slice(cardDeck.length - 4, cardDeck.length - 2),
    cardDeck: cardDeck.slice(0, cardDeck.length - 4), // remaining cards after player and dealer have been give theirs
    turn: "player_turn",
  };
};

function calculateCardScore(rank: CardRank): number {
  // For Jack, Queen, King, and Ace, the score is 10
  if ([CardRank.Ace].includes(rank)) {
    return 1;
  }
  if (Number(rank) >= Number(CardRank.Two) && Number(rank) <= Number(CardRank.Ten)) {
    return Number(rank);
  }

  return 10;
}

//Scoring
const calculateHandScore = (hand: Hand): number => {
  let numberOfAces = 0;
  let score = hand.reduce((acc, card) => {
    let scoreCard = calculateCardScore(card.rank);
    if (card.rank === CardRank.Ace) {
      numberOfAces++;
    }
    if (scoreCard + acc > 21 && [CardRank.Ace].includes(card.rank)) { // avoiding busting
      scoreCard = 1;
    }
    return acc + scoreCard;
  }, 0);

  // If there are Aces and using them as 11 doesn't cause busting, adjust the score
  while (numberOfAces > 0 && score + 10 <= 21) {
    score += 10;
    numberOfAces--;
  }

  return score;
};


const determineGameResult = (state: GameState): GameResult => {
  const playerScore = calculateHandScore(state.playerHand);
  const dealerScore = calculateHandScore(state.dealerHand);

  if (playerScore === 21 && state.playerHand.length === 2 && (dealerScore < 21 || state.dealerHand.length !== 2)) {
    // Player has Blackjack and dealer doesn't, player wins
    return "player_win";
  } else if (dealerScore === 21 && state.dealerHand.length === 2 && (playerScore < 21 || state.playerHand.length !== 2)) {
    // Dealer has Blackjack and player doesn't, dealer wins
    return "dealer_win";
  }

  if (playerScore > 21 && dealerScore <= 21) {
    // Player busts, dealer wins
    return "dealer_win";
  } else if (dealerScore > 21 && playerScore <= 21) {
    // Dealer busts, player wins
    return "player_win";
  } else if (playerScore > 21 && dealerScore > 21) {
    // Both bust, it's a draw
    return "draw";
  }

  // Neither player busts, compare their scores
  if (playerScore > dealerScore) {
    return "player_win";
  } else if (dealerScore > playerScore) {
    return "dealer_win";
  } else {
    // Scores are equal, it's a draw
    return "draw";
  }
};


//Player Actions
const playerStands = (state: GameState): GameState => {
  const dealerScore = calculateHandScore(state.dealerHand);

  if (dealerScore <= 16) {
    const { card, remaining } = takeCard(state.cardDeck);
    const newDealerHand = [...state.dealerHand, card];

    return {
      ...state,
      turn: "dealer_turn",
      dealerHand: newDealerHand,
      cardDeck: remaining,
    };
  }

  return {
    ...state,
    turn: "dealer_turn",
  };
};

const playerHits = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  return {
    ...state,
    cardDeck: remaining,
    playerHand: [...state.playerHand, card],
  };
};

//UI Component
const Game = (): JSX.Element => {
  const [state, setState] = useState(setupGame());

  return (
    <>
      <div>
        <p>There are {state.cardDeck.length} cards left in deck</p>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerHits)}
        >
          Hit
        </button>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerStands)}
        >
          Stand
        </button>
        <button onClick={(): void => setState(setupGame())}>Reset</button>
      </div>
      <p>Player Cards</p>
      <div>
        {state.playerHand.map(CardImage)}
        <p>Player Score {calculateHandScore(state.playerHand)}</p>
      </div>
      <p>Dealer Cards</p>
      {state.turn === "player_turn" && state.dealerHand.length > 0 ? (
        <div>
          <CardBackImage />
          <CardImage {...state.dealerHand[1]} />
        </div>
      ) : (
        <div>
          {state.dealerHand.map(CardImage)}
          <p>Dealer Score {calculateHandScore(state.dealerHand)}</p>
        </div>
      )}
      {state.turn === "dealer_turn" &&
        determineGameResult(state) != "no_result" ? (
        <p>{determineGameResult(state)}</p>
      ) : (
        <p>{state.turn}</p>
      )}
    </>
  );
};

export {
  Game,
  playerHits,
  playerStands,
  determineGameResult,
  calculateHandScore,
  setupGame,
};
