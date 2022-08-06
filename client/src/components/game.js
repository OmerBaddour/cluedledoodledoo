import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { sample, times } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { LEN_WORDS, MAX_GUESSES } from "../constants";
import "../index.css";
import Clue from "./clue.js";
import Row from "./row.js";

function Game() {
  const [guessedAnswer, setGuessedAnswer] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [validGuesses, setValidGuesses] = useState(undefined);

  const [answer, setAnswer] = useState("");
  const [answerCharCounts, setAnswerCharCounts] = useState({});

  const [guesses, setGuesses] = useState(Array(MAX_GUESSES).fill(""));
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);

  const [showResultsModal, setShowResultsModal] = useState(false);

  const gameInputRef = useRef(null);

  useEffect(() => {
    axios.get("/validAnswers").then((res) => {
      const game_answer = sample(res.data.validAnswers);
      setAnswer(game_answer);

      // compute count of each char in answer
      // https://nick3499.medium.com/javascript-populate-hash-table-with-string-character-counts-36459a41afe0
      const char_to_count = {};
      game_answer.split("").forEach((char) => {
        char_to_count[char] = (char_to_count[char] || 0) + 1;
      });
      setAnswerCharCounts(char_to_count);
    });

    axios.get("/validGuesses").then((res) => {
      const setAnswers = new Set(res.data.validGuesses);
      setValidGuesses(setAnswers);
    });

    gameInputRef.current.focus();
    // eslint-disable-next-line
  }, []);

  const handleKeyboardInput = (event) => {
    if (!gameOver) {
      if (/[a-zA-Z]/.test(event.key) && event.key.length === 1) {
        if (guesses[currentGuessIndex].length < LEN_WORDS) {
          const guessesCopy = guesses.slice();
          guessesCopy[currentGuessIndex] += event.key.toLowerCase();
          setGuesses(guessesCopy);
        }
      } else if (event.key === "Enter") {
        handleSubmitGuess();
      }
    }
  };

  const handleBackspace = (event) => {
    if (!gameOver && event.key === "Backspace") {
      if (guesses[currentGuessIndex].length > 0) {
        const guessesCopy = guesses.slice();
        guessesCopy[currentGuessIndex] = guesses[currentGuessIndex].slice(
          0,
          -1
        );
        setGuesses(guessesCopy);
      }
    }
  };

  const handleSubmitGuess = () => {
    if (
      !gameOver &&
      guesses[currentGuessIndex].length === LEN_WORDS &&
      validGuesses.has(guesses[currentGuessIndex])
    ) {
      if (guesses[currentGuessIndex] === answer) {
        setGuessedAnswer(true);
        setGameOver(true);
        setShowResultsModal(true);
      } else if (currentGuessIndex + 1 === MAX_GUESSES) {
        setGameOver(true);
        setShowResultsModal(true);
      }
      setCurrentGuessIndex(currentGuessIndex + 1);
    }
  };

  const useSynonymClue = () => {
    const guessesCopy = guesses.slice();
    guessesCopy[currentGuessIndex] = "x".repeat(LEN_WORDS);
    guessesCopy[currentGuessIndex + 1] = "x".repeat(LEN_WORDS);
    setGuesses(guessesCopy);
    setCurrentGuessIndex(currentGuessIndex + 2);
    // TODO debug focus
    gameInputRef.current.focus();
  };

  const renderResultsModal = () => {
    const gameWonDescriptors = [
      "Holy shit",
      "Incredible",
      "Wow",
      "Congrats",
      "Nice",
      "Phew",
    ];
    if (guessedAnswer) {
      // game won
      return (
        <Modal
          show={showResultsModal}
          onHide={() => {
            setShowResultsModal(false);
          }}
          className="game-won-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>You got it!</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {gameWonDescriptors[currentGuessIndex - 1]}! You found {answer} in{" "}
            {currentGuessIndex} guess
            {currentGuessIndex === 1 ? "" : "es"}!
          </Modal.Body>
        </Modal>
      );
    } else if (gameOver) {
      // game lost
      return (
        <Modal
          show={showResultsModal}
          onHide={() => {
            setShowResultsModal(false);
          }}
          className="game-lost-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>Unlucky!</Modal.Title>
          </Modal.Header>
          <Modal.Body>The answer is {answer}.</Modal.Body>
        </Modal>
      );
    }
    return null;
  };

  return (
    <>
      <div className="title">Cluedledoodledoo</div>
      <div
        onKeyPress={(event) => {
          handleKeyboardInput(event);
        }}
        onKeyDown={(event) => {
          handleBackspace(event);
        }}
        ref={gameInputRef}
        tabIndex={0}
      >
        {times(MAX_GUESSES, (i) => (
          <Row
            key={i}
            answer={answer}
            answerCharCounts={answerCharCounts}
            guess={guesses[i]}
            showColor={i < currentGuessIndex}
          />
        ))}
      </div>
      <Clue
        answer={answer}
        currentGuessIndex={currentGuessIndex}
        useSynonymClue={useSynonymClue}
      />
      {renderResultsModal()}
    </>
  );
}

export default Game;
