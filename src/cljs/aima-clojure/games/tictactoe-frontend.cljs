(ns aima-clojure.tictactoe-frontend
  (:require [clojure.string :as string]
            [goog.dom :as dom]
            [aima-clojure.games.tic-tac-toe :as ttt]
            [aima-clojure.game :as game]
            ))

(defn log [str]
  (js* "console.log(~{str})"))


(def tic-tac-toe (ttt/tic-tac-toe))
(def terminal-test game/terminal-test)

(log (= (terminal-test
         tic-tac-toe
         {:to-move :x
          :board [[:x :e :e]
                  [:o :o :e]
                  [:x :e :e]]
          :utility 0
          })))
